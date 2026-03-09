use actix_web::web;

use crate::handlers::{auth, medical_records, pets, shops, upload, wellbeing_notes};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            // Auth
            .service(
                web::scope("/auth")
                    .route("/register", web::post().to(auth::register))
                    .route("/login", web::post().to(auth::login))
                    .route("/me", web::get().to(auth::me)),
            )
            // Pets (owner-scoped)
            .service(
                web::scope("/pets")
                    .route("", web::get().to(pets::list_pets))
                    .route("", web::post().to(pets::create_pet))
                    .route("/{pet_id}", web::get().to(pets::get_pet))
                    .route("/{pet_id}", web::put().to(pets::update_pet))
                    .route("/{pet_id}", web::delete().to(pets::delete_pet))
                    // Pet photo upload
                    .route("/{pet_id}/photo", web::post().to(upload::upload_pet_photo))
                    // Medical records
                    .route("/{pet_id}/records", web::get().to(medical_records::list_records))
                    .route("/{pet_id}/records", web::post().to(medical_records::create_record))
                    .route(
                        "/{pet_id}/records/analyze",
                        web::post().to(upload::analyze_record_photo),
                    )
                    .route(
                        "/{pet_id}/records/{record_id}",
                        web::get().to(medical_records::get_record),
                    )
                    .route(
                        "/{pet_id}/records/{record_id}",
                        web::put().to(medical_records::update_record),
                    )
                    .route(
                        "/{pet_id}/records/{record_id}",
                        web::delete().to(medical_records::delete_record),
                    )
                    .route(
                        "/{pet_id}/records/{record_id}/prescriptions",
                        web::post().to(medical_records::add_prescription),
                    )
                    .route(
                        "/{pet_id}/records/{record_id}/photos",
                        web::post().to(upload::attach_record_photos),
                    )
                    // Wellbeing notes
                    .route(
                        "/{pet_id}/notes",
                        web::get().to(wellbeing_notes::list_notes),
                    )
                    .route(
                        "/{pet_id}/notes",
                        web::post().to(wellbeing_notes::create_note),
                    )
                    .route(
                        "/{pet_id}/notes/{note_id}",
                        web::delete().to(wellbeing_notes::delete_note),
                    ),
            )
            // Shops
            .service(
                web::scope("/shops")
                    .route("", web::get().to(shops::list_shops))
                    .route("", web::post().to(shops::create_shop))
                    .route("/my", web::get().to(shops::my_shop))
                    .route("/{shop_id}", web::get().to(shops::get_shop))
                    .route("/{shop_id}", web::put().to(shops::update_shop))
                    .route("/{shop_id}", web::delete().to(shops::delete_shop))
                    .route(
                        "/{shop_id}/services",
                        web::post().to(shops::add_service),
                    )
                    .route(
                        "/{shop_id}/services/{service_id}",
                        web::put().to(shops::update_service),
                    )
                    .route(
                        "/{shop_id}/services/{service_id}",
                        web::delete().to(shops::delete_service),
                    ),
            )
            // Vet portal
            .service(
                web::scope("/vet")
                    .route("/patients", web::get().to(medical_records::vet_list_patients))
                    .route(
                        "/patients/{pet_id}",
                        web::get().to(medical_records::vet_get_patient),
                    ),
            ),
    );
}
