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

// Run database migrations/initialization queries dynamically
if (connectionString) {
  pool.query(`
    CREATE TABLE IF NOT EXISTS connections (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'default_config',
      theaibot_api_url TEXT DEFAULT 'https://theaibot.io',
      theaibot_api_key TEXT,
      theaibot_instance_name TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `).catch(err => {
    console.error('Failed to run dynamic schema migration for connections table:', err);
  });
}
