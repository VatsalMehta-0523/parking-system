-- ParkSmart Database Initialization
-- Run: psql -U postgres -d parking_db -f schema.sql

-- Create database (run separately as superuser if needed)
-- CREATE DATABASE parking_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE booking_type_enum AS ENUM ('INSTANT', 'ADVANCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM (
    'RESERVED', 'ACTIVE', 'COMPLETED', 'OVERSTAY', 'CANCELLED', 'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID_OFFLINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  user_id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name           VARCHAR(255) NOT NULL,
  phone          VARCHAR(20)  NOT NULL UNIQUE,
  email          VARCHAR(255),
  is_verified    BOOLEAN DEFAULT FALSE,
  vehicle_number VARCHAR(20),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  provider_id   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  is_verified   BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  location_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  provider_id TEXT NOT NULL REFERENCES providers(provider_id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  area        VARCHAR(255),
  city        VARCHAR(100) NOT NULL,
  latitude    NUMERIC(10, 8) NOT NULL,
  longitude   NUMERIC(11, 8) NOT NULL,
  map_link    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_policies (
  policy_id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  location_id    TEXT NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
  hourly_rate    BIGINT NOT NULL,
  reservation_fee BIGINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slots (
  slot_id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  location_id    TEXT NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
  slot_name      VARCHAR(50) NOT NULL,
  roi_coordinates JSONB,
  slot_type      VARCHAR(50) DEFAULT 'CAR',
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id        TEXT NOT NULL REFERENCES users(user_id),
  location_id    TEXT NOT NULL REFERENCES locations(location_id),
  slot_id        TEXT REFERENCES slots(slot_id),
  booking_type   booking_type_enum NOT NULL,
  status         booking_status_enum NOT NULL DEFAULT 'RESERVED',
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end   TIMESTAMP NOT NULL,
  actual_start    TIMESTAMP,
  actual_end      TIMESTAMP,
  total_price     BIGINT,
  payment_status  payment_status_enum DEFAULT 'PENDING',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_location   ON bookings(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user       ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot       ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_times      ON bookings(scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_slots_location      ON slots(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_provider  ON locations(provider_id);
CREATE INDEX IF NOT EXISTS idx_locations_city      ON locations(city);
CREATE INDEX IF NOT EXISTS idx_users_phone         ON users(phone);
