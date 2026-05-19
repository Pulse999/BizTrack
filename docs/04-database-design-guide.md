-- BizTrack Learning Hub - Database Design Guide
-- For: Thembinkosi Kene & Jan Lodewyk Pretorius
-- 
-- ⚠️ IMPORTANT: This is a GUIDE, not the complete solution!
-- You must design the rest of the database yourself.
-- This file shows you HOW to think about database design.

-- =============================================
-- STEP 1: IDENTIFY ENTITIES (NOUNS)
-- =============================================
-- Look at your requirements and find the "things" in your system:
-- 
-- From the BizTrack Learning Hub requirements, what are the main entities?
-- Hint: Think about:
-- - Who uses the system? (users, admins)
-- - What are they working with? (courses, videos, quizzes)
-- - What needs to be tracked? (progress, attempts, results)
-- - What gets created? (certificates)
--
-- LIST ALL ENTITIES YOU CAN FIND:
-- 1. Users (both admins and regular users)
-- 2. Courses
-- 3. ___Videos__ (what contains the training content?)
-- 4. ___Quizzes__ (what tests the users?)
-- 5. ___Questions__ (what are inside the tests?)
-- 6. ___Answers__ (what are the options for each test item?)
-- 7. ___User_Video_Progress__ (what tracks if users watched something?)
-- 8. ___Quiz_attempts__ (what records when users take tests?)
-- 9. ___Certificates__ (what proves completion?)
--
-- You should have about 8-10 entities total

-- =============================================
-- STEP 2: EXAMPLE - USERS TABLE (Updated for BizTrack Integration)
-- =============================================
-- Here's a complete example of ONE table to help you understand the structure:

CREATE TABLE users (
    -- Primary Key: Unique identifier for each user in Learning Hub
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- ⭐ BIZTRACK INTEGRATION (VERY IMPORTANT!)
    -- These fields link this user to their BizTrack account
    biztrack_user_id INTEGER UNIQUE NOT NULL,  -- From BizTrack API: tblUser.UserID
    biztrack_company_id INTEGER,  -- From BizTrack API: tblCompany.CompanyID
    
    -- User information (from BizTrack API)
    email VARCHAR(120) UNIQUE NOT NULL,  -- From: tblUser.Email
    first_name VARCHAR(50) NOT NULL,  -- From: tblUser.Firstname
    last_name VARCHAR(50) NOT NULL,  -- From: tblUser.Lastname
    
    -- Role (is this person an admin or regular user?)
    is_admin BOOLEAN DEFAULT 0,  -- 0 = regular user, 1 = admin
    
    -- Timestamps (always good to track when things were created)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When first logged in
    last_login TIMESTAMP,  -- Updated each time they log in
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- When we last synced with BizTrack
);

-- CRITICAL NOTES ABOUT THIS TABLE:
-- 1. NO password field! BizTrack handles authentication via API
-- 2. biztrack_user_id is the KEY link between systems
-- 3. When user logs in via BizTrack API, you create/update this record
-- 4. This table stores Learning Hub data (progress, role) linked to BizTrack user

-- =============================================
-- HOW BIZTRACK AUTHENTICATION WORKS
-- =============================================

-- When a user logs in to YOUR app:
-- 
-- STEP 1: User enters email and password in YOUR login form
-- 
-- STEP 2: YOUR app sends those credentials to BizTrack API:
--   POST https://stage.biztrack.co.za/php/api/merchy_api/universal_login
--   Body: Email, Password, DeviceType, Key, etc.
--
-- STEP 3: BizTrack API responds (if credentials are correct):
--   {
--     "code": 200,
--     "tblUser": {
--       "UserID": 12492,  ← THIS becomes biztrack_user_id
--       "Firstname": "Merchie",
--       "Lastname": "Learning Platform",
--       "Email": "merchie111@biztrack.co.za"
--     },
--     "tblCompany": {
--       "CompanyID": 8  ← THIS becomes biztrack_company_id
--     }
--   }
--
-- STEP 4: YOUR app checks: Does biztrack_user_id=12492 exist in users table?
--   - If NO: INSERT new user with BizTrack data
--   - If YES: UPDATE last_login timestamp
--
-- STEP 5: Create a session for this user in YOUR app
--
-- STEP 6: User is now logged in to YOUR Learning Hub!

-- Example queries you'll need:

-- Check if user exists:
-- SELECT * FROM users WHERE biztrack_user_id = 12492;

-- Create new user on first login:
-- INSERT INTO users (biztrack_user_id, biztrack_company_id, email, first_name, last_name)
-- VALUES (12492, 8, 'merchie111@biztrack.co.za', 'Merchie', 'Learning Platform');

-- Update last login:
-- UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE biztrack_user_id = 12492;


-- =============================================
-- STEP 3: EXAMPLE - COURSES TABLE
-- =============================================
-- Here's another example showing a relationship with users:

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Foreign Key: Links to the user who created this course
    created_by INTEGER NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    
    -- This creates the relationship: course belongs to a user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- QUESTION FOR YOU: What does ON DELETE CASCADE mean?
-- Answer: ___If a parent row is deleted, ON DELETE CASCADE automatically deletes all child rows that reference it__

-- =============================================
-- YOUR TURN: DESIGN THE REST!
-- =============================================

-- TABLE 3: Videos (or whatever you call the training content)
-- Think about:
-- - What information does a video need? (title, url, description?)
-- - How is it related to courses? (one course has many videos)
-- - How do you keep videos in order? (first video, second video, etc.)
-- - What data type should you use for a YouTube URL?
--
-- CREATE TABLE _________ (
--     
-- );

-- TABLE 4: Quizzes
-- Think about:
-- - What information does a quiz need?
-- - How is it related to courses?
-- - What's the passing score? Should it be the same for all quizzes?
--
-- CREATE TABLE _________ (
--     
-- );

-- TABLE 5: Questions
-- Think about:
-- - How are questions related to quizzes?
-- - What information does each question need?
-- - How do you keep questions in order?
--
-- CREATE TABLE _________ (
--     
-- );

-- TABLE 6: Answers
-- Think about:
-- - How many answers per question? (hint: 4 options - A, B, C, D)
-- - How do you know which answer is correct?
-- - How are answers related to questions?
--
-- CREATE TABLE _________ (
--     
-- );

-- TABLE 7: User Progress on Videos
-- This is a "many-to-many" relationship!
-- Think about:
-- - A user can watch many videos
-- - A video can be watched by many users
-- - What do you need to track? (user_id, video_id, completed?, when?)
--
-- CREATE TABLE _________ (
--     
-- );

-- TABLE 8: Quiz Attempts
-- Think about:
-- - A user can attempt a quiz multiple times
-- - What information do you need to store?
-- - How do you calculate the score?
-- - Did they pass or fail?
--
-- CREATE TABLE _________ (
--     
-- );

-- TABLE 9: Certificates
-- Think about:
-- - When is a certificate created?
-- - What information should be on it?
-- - How do you link it to the user and course?
-- - Where is the PDF file stored?
--
-- CREATE TABLE _________ (
--     
-- );

-- =============================================
-- STEP 4: ADD INDEXES (for better performance)
-- =============================================
-- Indexes speed up queries on frequently searched columns
-- Example:
-- CREATE INDEX idx_videos_course ON videos(course_id);
--
-- ADD INDEXES FOR:
-- - Foreign keys (they're searched a lot!)
-- - Columns used in WHERE clauses
-- - Columns used in JOINs

-- =============================================
-- DESIGN CHECKLIST - USE THIS TO VALIDATE!
-- =============================================
-- Before submitting your schema, check:
--
-- [✅] Every table has a primary key (id)
-- [✅] All foreign keys are defined with FOREIGN KEY constraints
-- [✅] All required fields are marked NOT NULL
-- [✅] Passwords are stored as hashes, not plain text
-- [✅] Timestamps are added where appropriate (created_at, updated_at)
-- [✅] Boolean fields have default values
-- [✅] No redundant data (3rd Normal Form)
-- [✅] Relationships make sense:
-- [✅] One course has many videos
-- [✅] One course has one or more quizzes
-- [✅] One quiz has many questions
-- [✅] One question has many answers (4)
-- [✅] Many users can take many quizzes (many-to-many)
-- [✅] Many users can watch many videos (many-to-many)
-- [✅] All table names are plural (users, courses, videos)
-- [✅] All column names are lowercase with underscores (first_name)
-- [✅] Indexes are added for foreign keys

-- =============================================
-- HELPFUL TIPS
-- =============================================
-- 
-- DATA TYPES:
-- - INTEGER: For numbers, IDs
-- - VARCHAR(n): For short text (n = max length)
-- - TEXT: For long text (descriptions, questions)
-- - BOOLEAN: For yes/no (0 or 1)
-- - DECIMAL(5,2): For percentages (like 85.50%)
-- - TIMESTAMP: For dates and times
--
-- CONSTRAINTS:
-- - PRIMARY KEY: Unique identifier
-- - FOREIGN KEY: Links to another table
-- - NOT NULL: Field must have a value
-- - UNIQUE: No duplicates allowed
-- - DEFAULT: Default value if none provided
-- - ON DELETE CASCADE: Delete related records when parent is deleted
--
-- RELATIONSHIPS:
-- - One-to-Many: One course has many videos
-- - Many-to-Many: Many users take many quizzes (needs junction table)
--
-- NAMING CONVENTIONS:
-- - Tables: plural, lowercase (users, quiz_attempts)
-- - Columns: lowercase with underscores (first_name, video_url)
-- - Foreign keys: singular with _id (course_id, user_id)

-- =============================================
-- RESOURCES TO HELP YOU
-- =============================================
-- Database Design Tutorial:
-- https://www.lucidchart.com/pages/database-diagram/database-design
--
-- SQL Data Types:
-- https://www.w3schools.com/sql/sql_datatypes.asp
--
-- Foreign Keys Explained:
-- https://www.w3schools.com/sql/sql_foreignkey.asp
--
-- Normalization:
-- https://www.guru99.com/database-normalization.html

-- =============================================
-- TESTING YOUR DESIGN
-- =============================================
-- After you create your schema, test it:
--
-- 1. Can you insert a user?
-- INSERT INTO users (email, username, password_hash, first_name, last_name) 
-- VALUES ('test@test.com', 'testuser', 'hashed_password', 'Test', 'User');
--
-- 2. Can you insert a course for that user?
-- 3. Can you insert a video for that course?
-- 4. Can you query all videos in a course?
-- SELECT * FROM videos WHERE course_id = 1;
--
-- 5. Can you track user progress?

-- =============================================
-- QUESTIONS TO ASK YOURSELF
-- =============================================
-- As you design each table, ask:
--
-- 1. What is the purpose of this table?
-- 2. What information MUST be stored? (NOT NULL)
-- 3. What information is optional?
-- 4. How is this table related to others?
-- 5. What will I need to query? (needs indexes)
-- 6. Are there any duplicate data? (needs normalization)
-- 7. What happens if a related record is deleted?
-- 8. How does this integrate with BizTrack data?

-- =============================================
-- NEED HELP?
-- =============================================
-- If you're stuck:
-- 1. Review your user stories - what data do they mention?
-- 2. Draw your ERD on paper first
-- 3. Show it to your partner - explain it to them
-- 4. Ask your mentor during standup
-- 5. Look at examples of LMS databases online (for ideas, not copying!)
-- 6. Review the BizTrack API response - what data are you getting?

-- =============================================
-- REMEMBER
-- =============================================
-- This is worth 20 CREDITS (21% of your grade)!
-- Take your time and think it through.
-- The struggle is where the learning happens!
-- Good luck! 🚀
