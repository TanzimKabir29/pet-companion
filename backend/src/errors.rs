use actix_web::{HttpResponse, ResponseError};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    Internal(String),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Bcrypt error: {0}")]
    Bcrypt(#[from] bcrypt::BcryptError),

    #[error("Request error: {0}")]
    Request(#[from] reqwest::Error),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let body = ErrorResponse {
            error: self.to_string(),
        };
        match self {
            AppError::NotFound(_) => HttpResponse::NotFound().json(body),
            AppError::Unauthorized(_) => HttpResponse::Unauthorized().json(body),
            AppError::Forbidden(_) => HttpResponse::Forbidden().json(body),
            AppError::BadRequest(_) => HttpResponse::BadRequest().json(body),
            _ => {
                log::error!("Internal error: {}", self);
                HttpResponse::InternalServerError().json(body)
            }
        }
    }
}
