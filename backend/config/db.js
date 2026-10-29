const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    } 
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ekspedisi_patriot',
    };

const pool = new Pool(poolConfig);

let migrationDone = false;
const ensureSchema = async () => {
  if (migrationDone) return;
  try {
    await pool.query("ALTER TABLE modules ADD COLUMN IF NOT EXISTS module_name VARCHAR(255) DEFAULT 'Modul 1'");
    await pool.query("ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1");
    await pool.query("ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0");
    try {
      await pool.query("ALTER TYPE media_platform_type ADD VALUE IF NOT EXISTS 'local_video'");
    } catch (e) {}
    try {
      await pool.query("ALTER TYPE media_platform_type ADD VALUE IF NOT EXISTS 'local_pdf'");
    } catch (e) {}
    migrationDone = true;
    console.log('Database schema and migrations verified successfully');
  } catch (migErr) {
    console.error('Migration warning (non-fatal):', migErr.message);
  }
};

// Test connection on boot
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
    ensureSchema();
  }
});

module.exports = {
  query: async (text, params) => {
    if (!migrationDone) {
      await ensureSchema();
    }
    return pool.query(text, params);
  },
  pool
};
