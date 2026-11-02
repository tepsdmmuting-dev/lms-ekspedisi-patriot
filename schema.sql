-- Enum for media platform
CREATE TYPE media_platform_type AS ENUM ('youtube', 'tiktok', 'instagram', 'gdrive_pdf', 'local_video', 'local_pdf');

-- Enum for user role
CREATE TYPE user_role_type AS ENUM ('trainee', 'admin', 'co_admin');

-- Enum for visibility
CREATE TYPE visibility_type AS ENUM ('public', 'restricted');

-- Users Table
CREATE TABLE users (
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

-- Modules Table
CREATE TABLE modules (
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

-- Site Settings Table
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress Tracking Table (Intersection Table)
CREATE TABLE progress_tracking (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, module_id)
);

-- Insert some dummy data for testing
INSERT INTO users (name, email, password_hash, role, region, district) VALUES
('Admin User', 'admin@ep.gov.id', '$2b$10$EpI1Fv6/Gv.c.1Y45v6YjO0P0gYy2Dq6R5bVn6R5bVn6R5bVn6R5b', 'admin', 'Jakarta', 'Central Jakarta'),
('Budi Santoso', 'budi@trainee.id', '$2b$10$EpI1Fv6/Gv.c.1Y45v6YjO0P0gYy2Dq6R5bVn6R5bVn6R5bVn6R5b', 'trainee', 'Java Region', 'Sleman');

INSERT INTO modules (title, description, media_platform, external_url, category, visibility) VALUES
('Strategi Pengembangan Kepemimpinan di Era Digital', 'Memahami tantangan baru dalam memimpin tim lintas generasi dengan pendekatan berbasis data dan empati.', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Pelatihan', 'public'),
('Dasar-dasar Manajemen Proyek Infrastruktur', 'Pengenalan singkat mengenai metodologi agile dalam konteks pembangunan infrastruktur skala menengah.', 'instagram', 'https://www.instagram.com/reel/C-xyz/', 'Jadwal', 'public'),
('Protokol Keselamatan Lapangan (Bagian 1)', 'Panduan visual cepat mengenai standar keselamatan dasar untuk operasional di lapangan terbuka.', 'tiktok', 'https://www.tiktok.com/@example/video/1234567890', 'Dokumen Resmi', 'public'),
('Pemetaan Potensi Wilayah Transmigrasi', 'Pelajari teknik dasar pemetaan dan identifikasi sumber daya alam di area penugasan ekspedisi baru.', 'youtube', 'https://www.youtube.com/watch?v=12345', 'Pelatihan', 'restricted'),
('Sosiologi Masyarakat Desa', 'Panduan interaksi dan pendekatan kultural dengan masyarakat lokal di daerah tujuan transmigrasi.', 'gdrive_pdf', 'https://drive.google.com/file/d/1BXiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view', 'Dokumen Resmi', 'restricted');

INSERT INTO progress_tracking (user_id, module_id, completed, progress_percentage, completed_at) VALUES
(2, 4, true, 100, CURRENT_TIMESTAMP),
(2, 5, false, 45, NULL);

-- User Topics Assignment Table (Many-to-Many)
CREATE TABLE user_topics (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, topic)
);

-- Quizzes Table
CREATE TYPE quiz_type AS ENUM ('pre_test', 'post_test');
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type quiz_type NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (module_id, type)
);

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    image_url TEXT,
    options JSONB NOT NULL, -- Array of strings e.g. ["A", "B", "C", "D"]
    correct_answer_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

