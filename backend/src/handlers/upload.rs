use actix_multipart::Multipart;
use actix_web::{web, HttpResponse};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use futures_util::StreamExt;
use serde_json::json;
use sqlx::PgPool;
use std::path::Path;
use uuid::Uuid;

use crate::{
    config::Config,
    errors::AppError,
    middleware::auth::AuthenticatedUser,
    models::medical_record::AnalyzedMedicalRecord,
};

/// Upload a pet photo and return its URL
pub async fn upload_pet_photo(
    config: web::Data<Config>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
    pool: web::Data<PgPool>,
    mut payload: Multipart,
) -> Result<HttpResponse, AppError> {
    // Verify ownership
    super::pets::fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;

    let file_url = save_upload(&config, &mut payload, "pets").await?;

    // Update pet photo_url
    sqlx::query("UPDATE pets SET photo_url = $1, updated_at = NOW() WHERE id = $2")
        .bind(&file_url)
        .bind(*pet_id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(json!({ "url": file_url })))
}

/// Upload one or more medical record photos, analyze with Claude, return extracted data
pub async fn analyze_record_photo(
    config: web::Data<Config>,
    user: AuthenticatedUser,
    pet_id: web::Path<Uuid>,
    pool: web::Data<PgPool>,
    mut payload: Multipart,
) -> Result<HttpResponse, AppError> {
    super::pets::fetch_pet_authorized(pool.as_ref(), *pet_id, &user).await?;

    // Read file bytes and store
    let mut file_bytes: Option<(Vec<u8>, String)> = None;
    let mut saved_url: Option<String> = None;

    while let Some(item) = payload.next().await {
        let mut field = item.map_err(|e| AppError::Internal(e.to_string()))?;
        let content_type = field.content_type().map(|ct| ct.to_string()).unwrap_or_default();

        if !content_type.starts_with("image/") {
            continue;
        }

        let mime_type = content_type.clone();
        let mut bytes = Vec::new();
        while let Some(chunk) = field.next().await {
            let chunk = chunk.map_err(|e| AppError::Internal(e.to_string()))?;
            bytes.extend_from_slice(&chunk);
        }

        // Save to disk
        let ext = match mime_type.as_str() {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            _ => "jpg",
        };
        let filename = format!("{}.{}", Uuid::new_v4(), ext);
        let dir = format!("{}/records", config.upload_dir);
        std::fs::create_dir_all(&dir)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        let file_path = format!("{}/{}", dir, filename);
        std::fs::write(&file_path, &bytes)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        saved_url = Some(format!("/uploads/records/{}", filename));
        file_bytes = Some((bytes, mime_type));
        break;
    }

    let (bytes, mime_type) = file_bytes
        .ok_or_else(|| AppError::BadRequest("No image provided".into()))?;

    if config.anthropic_api_key.is_empty() {
        return Err(AppError::Internal("ANTHROPIC_API_KEY not configured".into()));
    }

    let analyzed = analyze_with_claude(&config.anthropic_api_key, &bytes, &mime_type).await?;

    Ok(HttpResponse::Ok().json(json!({
        "analyzed": analyzed,
        "photo_url": saved_url,
    })))
}

/// Save an uploaded file to disk, return the public URL path
async fn save_upload(
    config: &Config,
    payload: &mut Multipart,
    subdir: &str,
) -> Result<String, AppError> {
    while let Some(item) = payload.next().await {
        let mut field = item.map_err(|e| AppError::Internal(e.to_string()))?;
        let content_type = field.content_type().map(|ct| ct.to_string()).unwrap_or_default();

        if !content_type.starts_with("image/") {
            continue;
        }

        let ext = match content_type.as_str() {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            _ => "jpg",
        };

        let filename = format!("{}.{}", Uuid::new_v4(), ext);
        let dir = format!("{}/{}", config.upload_dir, subdir);
        std::fs::create_dir_all(&dir)
            .map_err(|e| AppError::Internal(e.to_string()))?;
        let file_path = format!("{}/{}", dir, filename);

        let mut bytes = Vec::new();
        while let Some(chunk) = field.next().await {
            let chunk = chunk.map_err(|e| AppError::Internal(e.to_string()))?;
            bytes.extend_from_slice(&chunk);
        }

        std::fs::write(&file_path, &bytes)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        return Ok(format!("/uploads/{}/{}", subdir, filename));
    }

    Err(AppError::BadRequest("No image file provided".into()))
}

async fn analyze_with_claude(
    api_key: &str,
    image_bytes: &[u8],
    mime_type: &str,
) -> Result<AnalyzedMedicalRecord, AppError> {
    let b64 = BASE64.encode(image_bytes);

    let body = json!({
        "model": "claude-opus-4-6",
        "max_tokens": 2048,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": b64
                        }
                    },
                    {
                        "type": "text",
                        "text": "This is a pet medical record or prescription. Please extract the following information and return it as a JSON object with these exact fields:\n- title (string): A concise title for this record\n- diagnosis (string or null): The diagnosis or condition\n- treatment (string or null): Treatment plan or procedures\n- notes (string or null): Any additional notes\n- record_date (string or null): Date of the record in YYYY-MM-DD format\n- vet_name (string or null): Name of the veterinarian\n- prescriptions (array): List of medications, each with:\n  - medication_name (string)\n  - dosage (string)\n  - frequency (string)\n  - duration (string or null)\n  - instructions (string or null)\n\nReturn ONLY the JSON object, no other text."
                    }
                ]
            }
        ]
    });

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await?;

    let response_json: serde_json::Value = response.json().await?;

    let content = response_json["content"][0]["text"]
        .as_str()
        .ok_or_else(|| AppError::Internal("Invalid response from Claude".into()))?;

    // Strip markdown code fences if present
    let json_str = content
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let analyzed: AnalyzedMedicalRecord = serde_json::from_str(json_str)
        .map_err(|e| AppError::Internal(format!("Failed to parse AI response: {}", e)))?;

    Ok(analyzed)
}

/// Attach additional photo URLs to an existing medical record
pub async fn attach_record_photos(
    config: web::Data<Config>,
    user: AuthenticatedUser,
    path: web::Path<(Uuid, Uuid)>,
    pool: web::Data<PgPool>,
    mut payload: Multipart,
) -> Result<HttpResponse, AppError> {
    let (pet_id, record_id) = path.into_inner();
    super::pets::fetch_pet_authorized(pool.as_ref(), pet_id, &user).await?;

    let mut urls: Vec<String> = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = item.map_err(|e| AppError::Internal(e.to_string()))?;
        let content_type = field.content_type().map(|ct| ct.to_string()).unwrap_or_default();
        if !content_type.starts_with("image/") {
            continue;
        }

        let ext = match content_type.as_str() {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp",
            _ => "jpg",
        };

        let filename = format!("{}.{}", Uuid::new_v4(), ext);
        let dir = format!("{}/records", config.upload_dir);
        std::fs::create_dir_all(&dir).map_err(|e| AppError::Internal(e.to_string()))?;
        let file_path = format!("{}/{}", dir, filename);

        let mut bytes = Vec::new();
        while let Some(chunk) = field.next().await {
            let chunk = chunk.map_err(|e| AppError::Internal(e.to_string()))?;
            bytes.extend_from_slice(&chunk);
        }
        std::fs::write(&file_path, &bytes).map_err(|e| AppError::Internal(e.to_string()))?;
        urls.push(format!("/uploads/records/{}", filename));
    }

    if urls.is_empty() {
        return Err(AppError::BadRequest("No images provided".into()));
    }

    // Append new URLs to existing photo_urls array
    sqlx::query(
        r#"
        UPDATE medical_records
        SET photo_urls = photo_urls || $1::jsonb, updated_at = NOW()
        WHERE id = $2 AND pet_id = $3
        "#,
    )
    .bind(serde_json::to_value(&urls).unwrap())
    .bind(record_id)
    .bind(pet_id)
    .execute(pool.as_ref())
    .await?;

    Ok(HttpResponse::Ok().json(json!({ "uploaded": urls })))
}
