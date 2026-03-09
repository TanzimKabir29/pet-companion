use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WellbeingNote {
    pub id: Uuid,
    pub pet_id: Uuid,
    pub owner_id: Uuid,
    pub mood: Option<String>,
    pub energy_level: Option<String>,
    pub appetite: Option<String>,
    pub note: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWellbeingNoteRequest {
    pub mood: Option<String>,
    pub energy_level: Option<String>,
    pub appetite: Option<String>,
    pub note: String,
}
