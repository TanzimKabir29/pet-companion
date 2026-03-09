use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PetShop {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub hours: Option<Value>,
    pub logo_url: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ShopService {
    pub id: Uuid,
    pub shop_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: Option<sqlx::types::Decimal>,
    pub category: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShopWithServices {
    #[serde(flatten)]
    pub shop: PetShop,
    pub services: Vec<ShopService>,
}

#[derive(Debug, Deserialize)]
pub struct CreateShopRequest {
    pub name: String,
    pub description: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub hours: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateShopRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub hours: Option<Value>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceRequest {
    pub name: String,
    pub description: Option<String>,
    pub price: Option<f64>,
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<f64>,
    pub category: Option<String>,
}
