mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;

use actix_cors::Cors;
use actix_files::Files;
use actix_web::{middleware::Logger, web, App, HttpServer};
use dotenv::dotenv;
use std::fs;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let config = config::Config::from_env();
    let port = config.port;

    // Ensure upload directories exist
    fs::create_dir_all(format!("{}/pets", config.upload_dir))?;
    fs::create_dir_all(format!("{}/records", config.upload_dir))?;

    let pool = db::create_pool(&config.database_url).await;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    log::info!("Starting server on port {}", port);

    let config = web::Data::new(config);
    let pool = web::Data::new(pool);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(web::Data::clone(&config))
            .app_data(web::Data::clone(&pool))
            .app_data(
                web::JsonConfig::default()
                    .error_handler(|err, _| {
                        actix_web::error::InternalError::from_response(
                            err,
                            actix_web::HttpResponse::BadRequest()
                                .json(serde_json::json!({ "error": err.to_string() })),
                        )
                        .into()
                    })
            )
            .configure(routes::configure)
            // Serve uploaded files
            .service(Files::new("/uploads", "./uploads").prefer_utf8(true))
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
