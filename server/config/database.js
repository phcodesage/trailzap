const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// PostgreSQL connection pool
const isSupabaseDb =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.includes('.supabase.co');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase Postgres requires SSL; allow self-signed certs
  ssl: isSupabaseDb ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Supabase client for additional features (auth, storage, etc.)
let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️  Supabase env vars missing: SUPABASE_URL and/or SUPABASE_ANON_KEY. Skipping Supabase client initialization.');
}

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  supabase,
  query,
  transaction,
  testConnection
};
