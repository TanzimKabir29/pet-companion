use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::{
        pet::{CreatePetRequest, Pet, UpdatePetRequest},
        user::UserType,
    },
};

pub async fn list_pets(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let owner_id = user.0.user_id();

    let pets = sqlx::query_as::<_, Pet>(
        "SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC"
    )
    .bind(owner_id)
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(pets))
}

pub async fn get_pet(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let pet = fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;
    Ok(HttpResponse::Ok().json(pet))
}

pub async fn create_pet(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    body: web::Json<CreatePetRequest>,
) -> Result<HttpResponse, AppError> {
    if user.0.user_type != UserType::Owner {
        return Err(AppError::Forbidden("Only pet owners can create pets".into()));
    }

    let body = body.into_inner();
    let owner_id = user.0.user_id();

    let pet = sqlx::query_as::<_, Pet>(
        r#"
        INSERT INTO pets (id, owner_id, name, species, breed, date_of_birth, weight_kg, gender, color, microchip_id, notes)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#,
    )
    .bind(owner_id)
    .bind(&body.name)
    .bind(&body.species)
    .bind(&body.breed)
    .bind(body.date_of_birth)
    .bind(body.weight_kg)
    .bind(&body.gender)
    .bind(&body.color)
    .bind(&body.microchip_id)
    .bind(&body.notes)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Created().json(pet))
}

pub async fn update_pet(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
    body: web::Json<UpdatePetRequest>,
) -> Result<HttpResponse, AppError> {
    let pet = fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;
    let body = body.into_inner();

    let updated = sqlx::query_as::<_, Pet>(
        r#"
        UPDATE pets SET
            name        = COALESCE($1, name),
            species     = COALESCE($2, species),
            breed       = COALESCE($3, breed),
            date_of_birth = COALESCE($4, date_of_birth),
            weight_kg   = COALESCE($5, weight_kg),
            gender      = COALESCE($6, gender),
            color       = COALESCE($7, color),
            microchip_id = COALESCE($8, microchip_id),
            photo_url   = COALESCE($9, photo_url),
            notes       = COALESCE($10, notes),
            updated_at  = NOW()
        WHERE id = $11
        RETURNING *
        "#,
    )
    .bind(body.name.as_deref())
    .bind(body.species.as_deref())
    .bind(body.breed.as_deref())
    .bind(body.date_of_birth)
    .bind(body.weight_kg)
    .bind(body.gender.as_deref())
    .bind(body.color.as_deref())
    .bind(body.microchip_id.as_deref())
    .bind(body.photo_url.as_deref())
    .bind(body.notes.as_deref())
    .bind(pet.id)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(updated))
}

pub async fn delete_pet(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let pet = fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;

    sqlx::query("DELETE FROM pets WHERE id = $1")
        .bind(pet.id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

/// Fetch a pet and ensure the requesting user is authorized to access it.
/// Owners can only access their own pets; vets can access any pet.
pub async fn fetch_pet_authorized(
    pool: &PgPool,
    pet_id: Uuid,
    user: &AuthenticatedUser,
) -> Result<Pet, AppError> {
    let pet = sqlx::query_as::<_, Pet>("SELECT * FROM pets WHERE id = $1")
        .bind(pet_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Pet not found".into()))?;

    match user.0.user_type {
        UserType::Owner if pet.owner_id != user.0.user_id() => {
            Err(AppError::Forbidden("You don't have access to this pet".into()))
        }
        UserType::Shop => Err(AppError::Forbidden("Shop accounts cannot access pet records".into())),
        _ => Ok(pet),
    }
}
