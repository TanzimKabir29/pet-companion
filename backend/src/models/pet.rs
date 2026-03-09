use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Pet {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub species: String,
    pub breed: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub weight_kg: Option<sqlx::types::Decimal>,
    pub gender: Option<String>,
    pub color: Option<String>,
    pub microchip_id: Option<String>,
    pub photo_url: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePetRequest {
    pub name: String,
    pub species: String,
    pub breed: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub weight_kg: Option<f64>,
    pub gender: Option<String>,
    pub color: Option<String>,
    pub microchip_id: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePetRequest {
    pub name: Option<String>,
    pub species: Option<String>,
    pub breed: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub weight_kg: Option<f64>,
    pub gender: Option<String>,
    pub color: Option<String>,
    pub microchip_id: Option<String>,
    pub photo_url: Option<String>,
    pub notes: Option<String>,
}
