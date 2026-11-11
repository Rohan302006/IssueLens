// ─── db.js — PostgreSQL (Neon) connection pool ────────────────
const { Pool } = require('pg');
const path     = require('path');
const dotenv   = require('dotenv');

// Ensure .env is loaded whether running from project root or backend folder
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

let connectionString = process.env.DATABASE_URL;

// Sanitize Neon URL: node-postgres with PgBouncer does not support channel_binding=require
if (connectionString) {
  connectionString = connectionString
    .replace(/([?&])channel_binding=[^&]+(&|$)/, '$1')
    .replace(/[?&]$/, '');
}

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    }
  : {
      host:     process.env.PGHOST || process.env.DB_HOST || 'localhost',
      port:     Number(process.env.PGPORT || process.env.DB_PORT) || 5432,
      user:     process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.PGDATABASE || process.env.DB_NAME || 'campus_portal',
      ssl:      process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 15000,          // Close idle clients after 15s so stale sockets are not reused across Neon sleep
  connectionTimeoutMillis: 30000,    // 30s timeout to allow Neon serverless compute to wake from sleep (takes 5-9s)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle errors on idle clients so Neon auto-suspend doesn't crash the server or corrupt pool state
pool.on('error', (err) => {
  console.warn('⚠️  [db pool] Idle PostgreSQL client error (recovered):', err.message);
});

// Resilient query executor that retries once on transient connection loss (e.g. Neon cold-start wakeups)
async function resilientQuery(text, params, retries = 2) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      lastErr = err;
      const isTransient =
        err.message?.includes('Connection terminated') ||
        err.message?.includes('connection timeout') ||
        err.message?.includes('timeout') ||
        err.code === 'ECONNRESET' ||
        err.code === '57P01' || // admin_shutdown (Neon suspend)
        err.code === '57P02' ||
        err.code === '57P03';

      if (isTransient && attempt < retries) {
        console.warn(`⚠️  [db] Transient error on attempt ${attempt} (${err.message}), retrying query...`);
        await new Promise(r => setTimeout(r, 600));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Test connection on startup (non-fatal so server can still start or retry)
if (connectionString || process.env.PGHOST || process.env.DB_HOST) {
  pool.connect()
    .then(client => {
      console.log('✅  PostgreSQL (Neon) connected successfully');
      client.release();
    })
    .catch(err => {
      console.error('❌  PostgreSQL connection failed:', err.message);
      console.error('    Please ensure DATABASE_URL is set in .env');
    });
}

module.exports = {
  query: (text, params) => resilientQuery(text, params),
  execute: (text, params) => resilientQuery(text, params),
  pool,
};
