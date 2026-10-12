-- ClimatePulse Database Schema (PostgreSQL)
-- Schema migration matching PRD Section 18 specifications

-- 1. Table: locations
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_city ON locations (LOWER(city));

-- 2. Table: climate_data
CREATE TABLE IF NOT EXISTS climate_data (
    id BIGSERIAL PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature NUMERIC(5, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL,
    pressure NUMERIC(6, 2) NOT NULL,
    wind_speed NUMERIC(5, 2) NOT NULL,
    rainfall NUMERIC(6, 2) DEFAULT 0.0,
    uv_index NUMERIC(4, 2) DEFAULT 0.0,
    weather_code INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_temperature CHECK (temperature >= -90.0 AND temperature <= 60.0),
    CONSTRAINT chk_humidity CHECK (humidity >= 0.0 AND humidity <= 100.0),
    CONSTRAINT chk_rainfall CHECK (rainfall >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_climate_loc_time ON climate_data (location_id, timestamp DESC);

-- 3. Table: air_quality
CREATE TABLE IF NOT EXISTS air_quality (
    id BIGSERIAL PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    aqi INT NOT NULL,
    pm25 NUMERIC(6, 2) NOT NULL,
    pm10 NUMERIC(6, 2) NOT NULL,
    co NUMERIC(7, 2),
    no2 NUMERIC(6, 2),
    so2 NUMERIC(6, 2),
    o3 NUMERIC(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_aqi CHECK (aqi >= 0 AND aqi <= 500),
    CONSTRAINT chk_pm25 CHECK (pm25 >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_air_quality_loc_time ON air_quality (location_id, timestamp DESC);

-- 4. Table: climate_insights
CREATE TABLE IF NOT EXISTS climate_insights (
    id BIGSERIAL PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE CASCADE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    insight_type VARCHAR(50) NOT NULL,
    insight_text TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    source VARCHAR(50) DEFAULT 'analytics-engine'
);

CREATE INDEX IF NOT EXISTS idx_insights_loc_time ON climate_insights (location_id, generated_at DESC);

-- Seed initial preset locations
INSERT INTO locations (id, city, country, latitude, longitude, timezone)
VALUES
    ('pune', 'Pune', 'India', 18.5204, 73.8567, 'Asia/Kolkata'),
    ('mumbai', 'Mumbai', 'India', 19.0760, 72.8777, 'Asia/Kolkata'),
    ('delhi', 'Delhi', 'India', 28.6139, 77.2090, 'Asia/Kolkata'),
    ('bangalore', 'Bangalore', 'India', 12.9716, 77.5946, 'Asia/Kolkata'),
    ('london', 'London', 'United Kingdom', 51.5074, -0.1278, 'Europe/London'),
    ('newyork', 'New York', 'United States', 40.7128, -74.0060, 'America/New_York'),
    ('tokyo', 'Tokyo', 'Japan', 35.6762, 139.6503, 'Asia/Tokyo')
ON CONFLICT (id) DO NOTHING;
