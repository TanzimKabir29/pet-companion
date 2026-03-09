-- Pet Companion Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User types: 'owner', 'vet', 'shop'
CREATE TYPE user_type AS ENUM ('owner', 'vet', 'shop');

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    user_type   user_type NOT NULL,
    full_name   TEXT NOT NULL,
    phone       TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    species         TEXT NOT NULL,
    breed           TEXT,
    date_of_birth   DATE,
    weight_kg       NUMERIC(5,2),
    gender          TEXT,
    color           TEXT,
    microchip_id    TEXT,
    photo_url       TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- record_source: 'in_app' (created by vet directly), 'photo_upload' (extracted from photo)
CREATE TYPE record_source AS ENUM ('in_app', 'photo_upload');

CREATE TABLE medical_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    -- The vet associated with this record (may differ from created_by if owner uploaded)
    vet_id          UUID REFERENCES users(id),
    vet_name        TEXT,
    title           TEXT NOT NULL,
    diagnosis       TEXT,
    treatment       TEXT,
    notes           TEXT,
    record_date     DATE NOT NULL,
    record_source   record_source NOT NULL DEFAULT 'in_app',
    photo_urls      JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id   UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    medication_name     TEXT NOT NULL,
    dosage              TEXT NOT NULL,
    frequency           TEXT NOT NULL,
    duration            TEXT,
    instructions        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wellbeing_notes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    owner_id    UUID NOT NULL REFERENCES users(id),
    mood        TEXT,
    energy_level TEXT,
    appetite    TEXT,
    note        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pet_shops (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    address     TEXT,
    city        TEXT,
    phone       TEXT,
    website     TEXT,
    hours       JSONB,
    logo_url    TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shop_services (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID NOT NULL REFERENCES pet_shops(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    price       NUMERIC(10,2),
    category    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_medical_records_vet_id ON medical_records(vet_id);
CREATE INDEX idx_prescriptions_record_id ON prescriptions(medical_record_id);
CREATE INDEX idx_wellbeing_notes_pet_id ON wellbeing_notes(pet_id);
CREATE INDEX idx_pet_shops_owner_id ON pet_shops(owner_id);
CREATE INDEX idx_shop_services_shop_id ON shop_services(shop_id);
