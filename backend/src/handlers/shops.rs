use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::{
        shop::{
            CreateServiceRequest, CreateShopRequest, PetShop, ShopService, ShopWithServices,
            UpdateServiceRequest, UpdateShopRequest,
        },
        user::UserType,
    },
};

pub async fn list_shops(
    pool: web::Data<PgPool>,
    _user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let shops = sqlx::query_as::<_, PetShop>(
        "SELECT * FROM pet_shops WHERE is_active = TRUE ORDER BY name",
    )
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(shops))
}

pub async fn get_shop(
    pool: web::Data<PgPool>,
    _user: AuthenticatedUser,
    shop_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let shop = sqlx::query_as::<_, PetShop>(
        "SELECT * FROM pet_shops WHERE id = $1 AND is_active = TRUE",
    )
    .bind(*shop_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Shop not found".into()))?;

    let services = sqlx::query_as::<_, ShopService>(
        "SELECT * FROM shop_services WHERE shop_id = $1 ORDER BY category, name",
    )
    .bind(shop.id)
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ShopWithServices { shop, services }))
}

pub async fn create_shop(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    body: web::Json<CreateShopRequest>,
) -> Result<HttpResponse, AppError> {
    if user.0.user_type != UserType::Shop {
        return Err(AppError::Forbidden(
            "Only shop accounts can create a shop".into(),
        ));
    }

    let body = body.into_inner();
    let hours = body.hours.unwrap_or(serde_json::Value::Null);

    let shop = sqlx::query_as::<_, PetShop>(
        r#"
        INSERT INTO pet_shops (id, owner_id, name, description, address, city, phone, website, hours)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#,
    )
    .bind(user.0.user_id())
    .bind(&body.name)
    .bind(&body.description)
    .bind(&body.address)
    .bind(&body.city)
    .bind(&body.phone)
    .bind(&body.website)
    .bind(&hours)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Created().json(shop))
}

pub async fn update_shop(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    shop_id: web::Path<Uuid>,
    body: web::Json<UpdateShopRequest>,
) -> Result<HttpResponse, AppError> {
    let shop = fetch_shop_authorized(pool.as_ref(), *shop_id, &user).await?;
    let body = body.into_inner();

    let updated = sqlx::query_as::<_, PetShop>(
        r#"
        UPDATE pet_shops SET
            name        = COALESCE($1, name),
            description = COALESCE($2, description),
            address     = COALESCE($3, address),
            city        = COALESCE($4, city),
            phone       = COALESCE($5, phone),
            website     = COALESCE($6, website),
            hours       = COALESCE($7, hours),
            is_active   = COALESCE($8, is_active),
            updated_at  = NOW()
        WHERE id = $9
        RETURNING *
        "#,
    )
    .bind(body.name.as_deref())
    .bind(body.description.as_deref())
    .bind(body.address.as_deref())
    .bind(body.city.as_deref())
    .bind(body.phone.as_deref())
    .bind(body.website.as_deref())
    .bind(body.hours)
    .bind(body.is_active)
    .bind(shop.id)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(updated))
}

pub async fn delete_shop(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    shop_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let shop = fetch_shop_authorized(pool.as_ref(), *shop_id, &user).await?;

    sqlx::query("DELETE FROM pet_shops WHERE id = $1")
        .bind(shop.id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

pub async fn my_shop(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    if user.0.user_type != UserType::Shop {
        return Err(AppError::Forbidden("Only shop accounts can access this".into()));
    }

    let shop = sqlx::query_as::<_, PetShop>(
        "SELECT * FROM pet_shops WHERE owner_id = $1 LIMIT 1",
    )
    .bind(user.0.user_id())
    .fetch_optional(pool.as_ref())
    .await?;

    match shop {
        Some(s) => {
            let services = sqlx::query_as::<_, ShopService>(
                "SELECT * FROM shop_services WHERE shop_id = $1 ORDER BY category, name",
            )
            .bind(s.id)
            .fetch_all(pool.as_ref())
            .await?;
            Ok(HttpResponse::Ok().json(ShopWithServices { shop: s, services }))
        }
        None => Ok(HttpResponse::NoContent().finish()),
    }
}

pub async fn add_service(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    shop_id: web::Path<Uuid>,
    body: web::Json<CreateServiceRequest>,
) -> Result<HttpResponse, AppError> {
    fetch_shop_authorized(pool.as_ref(), *shop_id, &user).await?;
    let body = body.into_inner();

    let service = sqlx::query_as::<_, ShopService>(
        r#"
        INSERT INTO shop_services (id, shop_id, name, description, price, category)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(*shop_id)
    .bind(&body.name)
    .bind(&body.description)
    .bind(body.price)
    .bind(&body.category)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Created().json(service))
}

pub async fn update_service(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
    body: web::Json<UpdateServiceRequest>,
) -> Result<HttpResponse, AppError> {
    let (shop_id, service_id) = path.into_inner();
    fetch_shop_authorized(pool.as_ref(), shop_id, &user).await?;
    let body = body.into_inner();

    let updated = sqlx::query_as::<_, ShopService>(
        r#"
        UPDATE shop_services SET
            name        = COALESCE($1, name),
            description = COALESCE($2, description),
            price       = COALESCE($3, price),
            category    = COALESCE($4, category)
        WHERE id = $5 AND shop_id = $6
        RETURNING *
        "#,
    )
    .bind(body.name.as_deref())
    .bind(body.description.as_deref())
    .bind(body.price)
    .bind(body.category.as_deref())
    .bind(service_id)
    .bind(shop_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Service not found".into()))?;

    Ok(HttpResponse::Ok().json(updated))
}

pub async fn delete_service(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (shop_id, service_id) = path.into_inner();
    fetch_shop_authorized(pool.as_ref(), shop_id, &user).await?;

    sqlx::query("DELETE FROM shop_services WHERE id = $1 AND shop_id = $2")
        .bind(service_id)
        .bind(shop_id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

async fn fetch_shop_authorized(
    pool: &PgPool,
    shop_id: Uuid,
    user: &AuthenticatedUser,
) -> Result<PetShop, AppError> {
    if user.0.user_type != UserType::Shop {
        return Err(AppError::Forbidden("Only shop accounts can manage shops".into()));
    }

    let shop = sqlx::query_as::<_, PetShop>("SELECT * FROM pet_shops WHERE id = $1")
        .bind(shop_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Shop not found".into()))?;

    if shop.owner_id != user.0.user_id() {
        return Err(AppError::Forbidden("You don't own this shop".into()));
    }

    Ok(shop)
}
