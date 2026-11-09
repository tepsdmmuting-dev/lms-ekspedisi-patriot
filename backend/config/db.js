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
    // 1. Auto-create custom types if missing
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE media_platform_type AS ENUM ('youtube', 'tiktok', 'instagram', 'gdrive_pdf', 'local_video', 'local_pdf');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE user_role_type AS ENUM ('trainee', 'admin', 'co_admin');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE visibility_type AS ENUM ('public', 'restricted');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE quiz_type AS ENUM ('pre_test', 'post_test');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Auto-create tables if database is brand new (without manual schema.sql import)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role_type DEFAULT 'trainee',
        region VARCHAR(255),
        district VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        media_platform media_platform_type NOT NULL,
        external_url TEXT NOT NULL,
        category VARCHAR(100),
        topic VARCHAR(255),
        module_name VARCHAR(255) DEFAULT 'Modul 1',
        order_index INTEGER DEFAULT 1,
        image_url TEXT,
        image_source VARCHAR(255),
        visibility visibility_type DEFAULT 'restricted',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS progress_tracking (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT false,
        progress_percentage INTEGER DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, module_id)
      );
      CREATE TABLE IF NOT EXISTS user_topics (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_id, topic)
      );
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type quiz_type NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (module_id, type)
      );
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        image_url TEXT,
        options JSONB NOT NULL,
        correct_answer_index INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Column & enum upgrades for existing databases
    await pool.query("ALTER TABLE modules ADD COLUMN IF NOT EXISTS module_name VARCHAR(255) DEFAULT 'Modul 1'");
    await pool.query("ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1");
    await pool.query("ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0");
    await pool.query("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT");
    try {
      await pool.query("ALTER TYPE media_platform_type ADD VALUE IF NOT EXISTS 'local_video'");
    } catch (e) {}
    try {
      await pool.query("ALTER TYPE media_platform_type ADD VALUE IF NOT EXISTS 'local_pdf'");
    } catch (e) {}
    try {
      await pool.query(`
        INSERT INTO user_topics (user_id, topic)
        SELECT user_id, 'IT' FROM user_topics WHERE topic = 'Teknologi'
        ON CONFLICT (user_id, topic) DO NOTHING;
        DELETE FROM user_topics WHERE topic = 'Teknologi';

        INSERT INTO user_topics (user_id, topic)
        SELECT user_id, 'Keuangan' FROM user_topics WHERE topic = 'Finance'
        ON CONFLICT (user_id, topic) DO NOTHING;
        DELETE FROM user_topics WHERE topic = 'Finance';
      `);
    } catch (e) {}

    // 4. Repair broken placeholder hash if imported from older schema.sql, and ensure default admin exists
    const validDefaultHash = '$2b$10$dRA5ebfopdEYXtoYnuUk/.2gkaVARtnQ525JQynfseTM/tBjdkdT2'; // password123
    const brokenDummyHash = '$2b$10$EpI1Fv6/Gv.c.1Y45v6YjO0P0gYy2Dq6R5bVn6R5bVn6R5bVn6R5b';
    await pool.query('UPDATE users SET password_hash = $1 WHERE password_hash = $2', [validDefaultHash, brokenDummyHash]);

    const adminCheck = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, region, district)
         VALUES ('Admin User', 'admin@ep.gov.id', $1, 'admin', 'Jakarta', 'Central Jakarta')
         ON CONFLICT (email) DO NOTHING`,
        [validDefaultHash]
      );
      console.log('Default admin user ensured: admin@ep.gov.id / password123');
    }

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
