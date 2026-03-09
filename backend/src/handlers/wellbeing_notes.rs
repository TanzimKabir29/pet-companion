use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::{
        user::UserType,
        wellbeing_note::{CreateWellbeingNoteRequest, WellbeingNote},
    },
};

use super::pets::fetch_pet_authorized;

pub async fn list_notes(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;

    let notes = sqlx::query_as::<_, WellbeingNote>(
        "SELECT * FROM wellbeing_notes WHERE pet_id = $1 ORDER BY created_at DESC",
    )
    .bind(*pet_id)
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(notes))
}

pub async fn create_note(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
    body: web::Json<CreateWellbeingNoteRequest>,
) -> Result<HttpResponse, AppError> {
    if user.0.user_type != UserType::Owner {
        return Err(AppError::Forbidden(
            "Only pet owners can add wellbeing notes".into(),
        ));
    }

    fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;
    let body = body.into_inner();

    let note = sqlx::query_as::<_, WellbeingNote>(
        r#"
        INSERT INTO wellbeing_notes (id, pet_id, owner_id, mood, energy_level, appetite, note)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(*pet_id)
    .bind(user.0.user_id())
    .bind(&body.mood)
    .bind(&body.energy_level)
    .bind(&body.appetite)
    .bind(&body.note)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Created().json(note))
}

pub async fn delete_note(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (pet_id, note_id) = path.into_inner();
    fetch_pet_authorized(pool.as_ref(), pet_id, &user).await?;

    let note = sqlx::query_as::<_, WellbeingNote>(
        "SELECT * FROM wellbeing_notes WHERE id = $1 AND pet_id = $2",
    )
    .bind(note_id)
    .bind(pet_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Note not found".into()))?;

    if note.owner_id != user.0.user_id() {
        return Err(AppError::Forbidden("You cannot delete this note".into()));
    }

    sqlx::query("DELETE FROM wellbeing_notes WHERE id = $1")
        .bind(note_id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}
