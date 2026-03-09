use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "record_source", rename_all = "snake_case")]
pub enum RecordSource {
    InApp,
    PhotoUpload,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MedicalRecord {
    pub id: Uuid,
    pub pet_id: Uuid,
    pub created_by: Uuid,
    pub vet_id: Option<Uuid>,
    pub vet_name: Option<String>,
    pub title: String,
    pub diagnosis: Option<String>,
    pub treatment: Option<String>,
    pub notes: Option<String>,
    pub record_date: NaiveDate,
    pub record_source: RecordSource,
    pub photo_urls: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Prescription {
    pub id: Uuid,
    pub medical_record_id: Uuid,
    pub medication_name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: Option<String>,
    pub instructions: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalRecordWithPrescriptions {
    #[serde(flatten)]
    pub record: MedicalRecord,
    pub prescriptions: Vec<Prescription>,
}

#[derive(Debug, Deserialize)]
pub struct PrescriptionInput {
    pub medication_name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: Option<String>,
    pub instructions: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMedicalRecordRequest {
    pub title: String,
    pub diagnosis: Option<String>,
    pub treatment: Option<String>,
    pub notes: Option<String>,
    pub record_date: NaiveDate,
    pub vet_name: Option<String>,
    pub prescriptions: Option<Vec<PrescriptionInput>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMedicalRecordRequest {
    pub title: Option<String>,
    pub diagnosis: Option<String>,
    pub treatment: Option<String>,
    pub notes: Option<String>,
    pub record_date: Option<NaiveDate>,
    pub vet_name: Option<String>,
}

/// Response from AI analysis of a medical record photo
#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyzedMedicalRecord {
    pub title: String,
    pub diagnosis: Option<String>,
    pub treatment: Option<String>,
    pub notes: Option<String>,
    pub record_date: Option<String>,
    pub vet_name: Option<String>,
    pub prescriptions: Vec<PrescriptionInput>,
}
