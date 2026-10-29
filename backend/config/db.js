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

// Test connection and auto-migrate needed columns
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Database connected successfully');
    try {
      await client.query("ALTER TABLE modules ADD COLUMN IF NOT EXISTS module_name VARCHAR(255) DEFAULT 'Modul 1'");
      await client.query("ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1");
      // Clean up any null values for older modules
      await client.query("UPDATE modules SET module_name = 'Modul 1' WHERE module_name IS NULL OR module_name = ''");
      await client.query("UPDATE modules SET order_index = 1 WHERE order_index IS NULL");
      // Auto-migrate enum values for offline support if media_platform_type exists
      try {
        await client.query("ALTER TYPE media_platform_type ADD VALUE IF NOT EXISTS 'local_video'");
      } catch (e) {}
      try {
        await client.query("ALTER TYPE media_platform_type ADD VALUE IF NOT EXISTS 'local_pdf'");
      } catch (e) {}
    } catch (migErr) {
      console.error('Migration warning (non-fatal):', migErr.message);
    } finally {
      release();
    }
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
