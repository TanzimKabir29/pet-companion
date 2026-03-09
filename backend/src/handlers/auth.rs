use actix_web::{web, HttpResponse};
use sqlx::PgPool;

use crate::{
    config::Config,
    errors::AppError,
    middleware::auth::create_token,
    models::user::{AuthResponse, LoginRequest, RegisterRequest, User, UserPublic},
};

pub async fn register(
    pool: web::Data<PgPool>,
    config: web::Data<Config>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    let body = body.into_inner();

    // Check if email already exists
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE email = $1"
    )
    .bind(&body.email)
    .fetch_one(pool.as_ref())
    .await?;

    if existing > 0 {
        return Err(AppError::BadRequest("Email already registered".into()));
    }

    let password_hash = bcrypt::hash(&body.password, bcrypt::DEFAULT_COST)?;
    let id = uuid::Uuid::new_v4();

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, password_hash, user_type, full_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&body.email)
    .bind(&password_hash)
    .bind(&body.user_type)
    .bind(&body.full_name)
    .bind(&body.phone)
    .fetch_one(pool.as_ref())
    .await?;

    let token = create_token(
        &user.id,
        &user.email,
        &user.user_type,
        &config.jwt_secret,
        config.jwt_expires_in,
    )?;

    Ok(HttpResponse::Created().json(AuthResponse {
        token,
        user: user.into(),
    }))
}

pub async fn login(
    pool: web::Data<PgPool>,
    config: web::Data<Config>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    let body = body.into_inner();

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&body.email)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

    let valid = bcrypt::verify(&body.password, &user.password_hash)?;
    if !valid {
        return Err(AppError::Unauthorized("Invalid email or password".into()));
    }

    let token = create_token(
        &user.id,
        &user.email,
        &user.user_type,
        &config.jwt_secret,
        config.jwt_expires_in,
    )?;

    Ok(HttpResponse::Ok().json(AuthResponse {
        token,
        user: user.into(),
    }))
}

pub async fn me(
    pool: web::Data<PgPool>,
    user: crate::middleware::auth::AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let user_id = user.0.user_id();

    let profile = sqlx::query_as::<_, UserPublic>(
        r#"
        SELECT id, email, user_type, full_name, phone, avatar_url, created_at
        FROM users WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    Ok(HttpResponse::Ok().json(profile))
}
