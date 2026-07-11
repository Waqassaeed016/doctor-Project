import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

// For build-time validation, we check for connection string only when running logic, 
// to prevent build errors if the variable is not set during CI/CD.
const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:password@localhost:5432/placeholder',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;

// Auto-migration: Create all tables if they don't exist on startup
// This runs once on server start and is safe to run repeatedly (IF NOT EXISTS)
if (connectionString) {
  pool.query(`
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- 1. Patients
    CREATE TABLE IF NOT EXISTS patients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      age INTEGER,
      gender VARCHAR(50),
      medical_history TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 2. Doctors
    CREATE TABLE IF NOT EXISTS doctors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      specialization VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 3. Appointments
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES doctors(id),
      appointment_time TIMESTAMP,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      symptoms TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 4. Prescriptions
    CREATE TABLE IF NOT EXISTS prescriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID NOT NULL REFERENCES doctors(id),
      diagnosis TEXT,
      medicines JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 5. Medical Files
    CREATE TABLE IF NOT EXISTS medical_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_type VARCHAR(50),
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- 6. Connections (theaibot config)
    CREATE TABLE IF NOT EXISTS connections (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'default_config',
      theaibot_api_url TEXT DEFAULT 'https://theaibot.io',
      theaibot_api_key TEXT,
      theaibot_instance_name TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `).then(() => {
    console.log('✅ Database tables verified/created successfully.');
  }).catch(err => {
    console.error('❌ Auto-migration failed:', err.message);
  });
}
