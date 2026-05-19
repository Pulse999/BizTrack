-- ==========================================================
-- RESET DATABASE (fresh start)
-- ==========================================================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- COMPANY (Multi-tenant)
-- ==========================================================
CREATE TABLE company (
  company_id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  domain VARCHAR(200) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
);

-- ==========================================================
-- USERS
-- ==========================================================
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  biztrack_user_id INT UNIQUE,
  company_id INT NULL REFERENCES company(company_id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_company ON users(company_id);

-- ==========================================================
-- COURSES
-- ==========================================================
CREATE TABLE courses (
  course_id SERIAL PRIMARY KEY,
  company_id INT NULL REFERENCES company(company_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score DECIMAL(5,2) DEFAULT 80.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_company ON courses(company_id);

-- ==========================================================
-- USER ENROLLMENTS
-- ==========================================================
CREATE TABLE enrolled_courses (
  enrollment_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  progress_percent DECIMAL(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (user_id, course_id)
);

-- ==========================================================
-- VIDEOS
-- ==========================================================
CREATE TABLE videos (
  video_id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_seconds INT,
  position INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE videos
  ADD CONSTRAINT uq_videos_video_course UNIQUE (video_id, course_id);

CREATE INDEX idx_videos_course ON videos(course_id);

-- ==========================================================
-- QUIZZES (One Per Video)
-- ==========================================================
CREATE TABLE quizzes (
  quiz_id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  video_id INT UNIQUE REFERENCES videos(video_id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  passing_score DECIMAL(5,2) DEFAULT 80.00,
  attempts_allowed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE quizzes
  ADD CONSTRAINT fk_quizzes_video_course
  FOREIGN KEY (video_id, course_id)
  REFERENCES videos(video_id, course_id)
  ON DELETE CASCADE;

CREATE INDEX idx_quizzes_course ON quizzes(course_id);

-- ==========================================================
-- QUESTIONS
-- ==========================================================
CREATE TABLE questions (
  question_id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INT DEFAULT 1,
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);

-- ==========================================================
-- ANSWERS
-- ==========================================================
CREATE TABLE answers (
  answer_id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_question ON answers(question_id);

-- ==========================================================
-- USER VIDEO PROGRESS
-- ==========================================================
CREATE TABLE user_video_progress (
  video_progress_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  video_id INT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  watch_seconds INT DEFAULT 0,
  UNIQUE (user_id, video_id)
);

-- ==========================================================
-- QUIZ ATTEMPTS
-- ==========================================================
CREATE TABLE quiz_attempts (
  attempt_id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  duration_seconds INT DEFAULT NULL,
  attempt_number INT DEFAULT 1
);

-- ==========================================================
-- QUIZ ATTEMPT ANSWERS
-- ==========================================================
CREATE TABLE quiz_attempt_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INT NOT NULL REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  selected_answer_id INT NULL REFERENCES answers(answer_id) ON DELETE SET NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

-- ==========================================================
-- CERTIFICATES
-- ==========================================================
CREATE TABLE certificates (
  certification_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  quiz_attempt_id INT NULL REFERENCES quiz_attempts(attempt_id) ON DELETE SET NULL,
  certificate_number VARCHAR(100) UNIQUE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score DECIMAL(5,2),
  pdf_url TEXT,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE bookmarks (
  bookmark_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, course_id)
);

CREATE TABLE course_ratings (
  rating_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, course_id)
);

-- Add missing columns on courses (if not already there)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50);

-- Ratings per user & course
CREATE TABLE IF NOT EXISTS course_ratings (
  rating_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_cert_user ON certificates(user_id);

ALTER TABLE users 
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE courses
DROP COLUMN IF EXISTS passing_score;

ALTER TABLE courses 
ALTER COLUMN is_active SET DEFAULT FALSE;

-- ==========================================================
-- SAMPLE DATA (for login testing)
-- ==========================================================

INSERT INTO company (company_id, name, domain)
VALUES (8, 'BizTrack', 'biztrack.co.za');

INSERT INTO users (biztrack_user_id, company_id, email, first_name, last_name, is_admin, is_super_admin)
VALUES
(12492, 8, 'merchie111@biztrack.co.za', 'Merchie', 'Learning Platform', FALSE, FALSE),
(12493, 8, 'admin111@biztrack.co.za', 'Admin', 'Platform', TRUE, TRUE);
