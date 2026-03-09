use actix_web::{web, HttpResponse};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::{
        medical_record::{
            CreateMedicalRecordRequest, MedicalRecord, MedicalRecordWithPrescriptions,
            Prescription, RecordSource, UpdateMedicalRecordRequest,
        },
        user::UserType,
    },
};

use super::pets::fetch_pet_authorized;

pub async fn list_records(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;

    let records = sqlx::query_as::<_, MedicalRecord>(
        "SELECT * FROM medical_records WHERE pet_id = $1 ORDER BY record_date DESC",
    )
    .bind(*pet_id)
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(records))
}

pub async fn get_record(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (pet_id, record_id) = path.into_inner();
    fetch_pet_authorized(pool.as_ref(), pet_id, &user).await?;

    let record = sqlx::query_as::<_, MedicalRecord>(
        "SELECT * FROM medical_records WHERE id = $1 AND pet_id = $2",
    )
    .bind(record_id)
    .bind(pet_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Medical record not found".into()))?;

    let prescriptions = sqlx::query_as::<_, Prescription>(
        "SELECT * FROM prescriptions WHERE medical_record_id = $1 ORDER BY created_at",
    )
    .bind(record.id)
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(MedicalRecordWithPrescriptions {
        record,
        prescriptions,
    }))
}

pub async fn create_record(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
    body: web::Json<CreateMedicalRecordRequest>,
) -> Result<HttpResponse, AppError> {
    fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;
    let body = body.into_inner();

    let (record_source, vet_id) = match user.0.user_type {
        UserType::Vet => (RecordSource::InApp, Some(user.0.user_id())),
        _ => (RecordSource::InApp, None),
    };

    let mut tx = pool.begin().await?;

    let record = sqlx::query_as::<_, MedicalRecord>(
        r#"
        INSERT INTO medical_records
            (id, pet_id, created_by, vet_id, vet_name, title, diagnosis, treatment, notes, record_date, record_source, photo_urls)
        VALUES
            (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '[]')
        RETURNING *
        "#,
    )
    .bind(*pet_id)
    .bind(user.0.user_id())
    .bind(vet_id)
    .bind(&body.vet_name)
    .bind(&body.title)
    .bind(&body.diagnosis)
    .bind(&body.treatment)
    .bind(&body.notes)
    .bind(body.record_date)
    .bind(record_source)
    .fetch_one(&mut *tx)
    .await?;

    let mut prescriptions = Vec::new();
    if let Some(rxs) = body.prescriptions {
        for rx in rxs {
            let p = sqlx::query_as::<_, Prescription>(
                r#"
                INSERT INTO prescriptions (id, medical_record_id, medication_name, dosage, frequency, duration, instructions)
                VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
                RETURNING *
                "#,
            )
            .bind(record.id)
            .bind(&rx.medication_name)
            .bind(&rx.dosage)
            .bind(&rx.frequency)
            .bind(&rx.duration)
            .bind(&rx.instructions)
            .fetch_one(&mut *tx)
            .await?;
            prescriptions.push(p);
        }
    }

    tx.commit().await?;

    Ok(HttpResponse::Created().json(MedicalRecordWithPrescriptions {
        record,
        prescriptions,
    }))
}

pub async fn update_record(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
    body: web::Json<UpdateMedicalRecordRequest>,
) -> Result<HttpResponse, AppError> {
    let (pet_id, record_id) = path.into_inner();
    fetch_pet_authorized(pool.as_ref(), pet_id, &user).await?;

    let record = sqlx::query_as::<_, MedicalRecord>(
        "SELECT * FROM medical_records WHERE id = $1 AND pet_id = $2",
    )
    .bind(record_id)
    .bind(pet_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Medical record not found".into()))?;

    // Only the creator, the associated vet, or the pet owner can update
    let user_id = user.0.user_id();
    if record.created_by != user_id && record.vet_id != Some(user_id) {
        return Err(AppError::Forbidden("You cannot edit this record".into()));
    }

    let body = body.into_inner();
    let updated = sqlx::query_as::<_, MedicalRecord>(
        r#"
        UPDATE medical_records SET
            title       = COALESCE($1, title),
            diagnosis   = COALESCE($2, diagnosis),
            treatment   = COALESCE($3, treatment),
            notes       = COALESCE($4, notes),
            record_date = COALESCE($5, record_date),
            vet_name    = COALESCE($6, vet_name),
            updated_at  = NOW()
        WHERE id = $7
        RETURNING *
        "#,
    )
    .bind(body.title.as_deref())
    .bind(body.diagnosis.as_deref())
    .bind(body.treatment.as_deref())
    .bind(body.notes.as_deref())
    .bind(body.record_date)
    .bind(body.vet_name.as_deref())
    .bind(record_id)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(updated))
}

pub async fn delete_record(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<HttpResponse, AppError> {
    let (pet_id, record_id) = path.into_inner();
    fetch_pet_authorized(pool.as_ref(), pet_id, &user).await?;

    let record = sqlx::query_as::<_, MedicalRecord>(
        "SELECT * FROM medical_records WHERE id = $1 AND pet_id = $2",
    )
    .bind(record_id)
    .bind(pet_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Medical record not found".into()))?;

    let user_id = user.0.user_id();
    if record.created_by != user_id {
        return Err(AppError::Forbidden("Only the record creator can delete it".into()));
    }

    sqlx::query("DELETE FROM medical_records WHERE id = $1")
        .bind(record_id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

pub async fn add_prescription(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
    body: web::Json<crate::models::medical_record::PrescriptionInput>,
) -> Result<HttpResponse, AppError> {
    let (pet_id, record_id) = path.into_inner();
    fetch_pet_authorized(pool.as_ref(), pet_id, &user).await?;

    let body = body.into_inner();
    let prescription = sqlx::query_as::<_, Prescription>(
        r#"
        INSERT INTO prescriptions (id, medical_record_id, medication_name, dosage, frequency, duration, instructions)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(record_id)
    .bind(&body.medication_name)
    .bind(&body.dosage)
    .bind(&body.frequency)
    .bind(&body.duration)
    .bind(&body.instructions)
    .fetch_one(pool.as_ref())
    .await?;

    Ok(HttpResponse::Created().json(prescription))
}

/// Vet-specific: list all pets they have records for
pub async fn vet_list_patients(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    if user.0.user_type != UserType::Vet {
        return Err(AppError::Forbidden("Only vets can access this endpoint".into()));
    }

    let patients = sqlx::query(
        r#"
        SELECT DISTINCT p.id, p.name, p.species, p.breed, p.photo_url,
               u.full_name as owner_name, u.email as owner_email
        FROM pets p
        JOIN users u ON u.id = p.owner_id
        JOIN medical_records mr ON mr.pet_id = p.id
        WHERE mr.vet_id = $1 OR mr.created_by = $1
        ORDER BY p.name
        "#,
    )
    .bind(user.0.user_id())
    .fetch_all(pool.as_ref())
    .await?;

    let result: Vec<serde_json::Value> = patients
        .iter()
        .map(|row| {
            use sqlx::Row;
            json!({
                "id": row.get::<Uuid, _>("id"),
                "name": row.get::<String, _>("name"),
                "species": row.get::<String, _>("species"),
                "breed": row.get::<Option<String>, _>("breed"),
                "photo_url": row.get::<Option<String>, _>("photo_url"),
                "owner_name": row.get::<String, _>("owner_name"),
                "owner_email": row.get::<String, _>("owner_email"),
            })
        })
        .collect();

    Ok(HttpResponse::Ok().json(result))
}

pub async fn vet_get_patient(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    if user.0.user_type != UserType::Vet {
        return Err(AppError::Forbidden("Only vets can access this endpoint".into()));
    }

    let pet = sqlx::query_as::<_, crate::models::pet::Pet>(
        "SELECT * FROM pets WHERE id = $1"
    )
    .bind(*pet_id)
    .fetch_optional(pool.as_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Pet not found".into()))?;

    let records = sqlx::query_as::<_, MedicalRecord>(
        "SELECT * FROM medical_records WHERE pet_id = $1 ORDER BY record_date DESC",
    )
    .bind(*pet_id)
    .fetch_all(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(json!({ "pet": pet, "records": records })))
}
