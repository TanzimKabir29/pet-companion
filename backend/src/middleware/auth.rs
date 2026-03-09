use actix_web::{dev::Payload, Error, FromRequest, HttpRequest};
use futures::future::{ready, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::user::UserType;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,       // user ID
    pub email: String,
    pub user_type: UserType,
    pub exp: usize,
}

impl Claims {
    pub fn user_id(&self) -> Uuid {
        Uuid::parse_str(&self.sub).expect("Invalid UUID in JWT claims")
    }
}

pub struct AuthenticatedUser(pub Claims);

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "));

        match token {
            Some(token) => {
                let secret = std::env::var("JWT_SECRET")
                    .unwrap_or_else(|_| "change-me-in-production".to_string());

                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(secret.as_bytes()),
                    &Validation::default(),
                ) {
                    Ok(data) => ready(Ok(AuthenticatedUser(data.claims))),
                    Err(_) => ready(Err(actix_web::error::ErrorUnauthorized("Invalid token"))),
                }
            }
            None => ready(Err(actix_web::error::ErrorUnauthorized(
                "Authorization header missing",
            ))),
        }
    }
}

pub fn create_token(
    user_id: &Uuid,
    email: &str,
    user_type: &UserType,
    secret: &str,
    expires_in: i64,
) -> Result<String, jsonwebtoken::errors::Error> {
    use jsonwebtoken::{encode, EncodingKey, Header};

    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::seconds(expires_in))
        .expect("Valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        user_type: user_type.clone(),
        exp: expiration,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
}
