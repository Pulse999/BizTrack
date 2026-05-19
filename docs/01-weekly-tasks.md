# BizTrack Learning Hub - 3-Week Task Breakdown

## Week 1: Planning & Design (Days 1-7)

### Day 1: Project Kickoff & Requirements
**Goals:** Understand the project and start planning

**Tasks:**
- [✅] Morning: Attend project kickoff meeting with BizTrack team
- [✅] Read the entire project brief document
- [✅] Set up communication channels with mentor
- [✅] Create a shared Google Doc for questions and notes
- [✅] Write down 5 questions about features you're unsure about
- [✅] Create a GitHub repository for the project
- [✅] Add both team members as collaborators

**Deliverables:**
- GitHub repo created
- Questions document ready for Day 2 review

---

### Day 2: Requirements Documentation
**Goals:** Define what you're building in detail

**Tasks:**
- [✅] Morning standup: Share your understanding of the project
- [✅] Review answers to your Day 1 questions
- [✅] Create a requirements document (Google Doc or Markdown)
- [✅] List all user stories (at least 15):
  -✅"As an admin, I want to create courses so that..."
  -✅"As a user, I want to watch videos so that..."
- [✅] Define acceptance criteria for each user story
- [✅] Prioritize features: Must Have, Should Have, Nice to Have
- [✅] Create a simple project timeline

**Deliverables:**
- Requirements document with user stories
- Project timeline

**Example User Story Format:**
```
Story: Admin creates a course
As an: Admin
I want to: Create a new course with a title and description
So that: Users can access organized training content
Acceptance Criteria:
- Admin can enter course title (max 100 chars)
- Admin can enter course description (max 500 chars)
- Course is saved to database
- Admin sees success message
- Course appears in admin's course list
```

---

### Day 3: Database Design (Part 1)
**Goals:** Design the database schema

**Tasks:**
- [✅] Morning standup: Share yesterday's user stories
- [✅] Review the provided database schema document
- [✅] Using paper or draw.io, sketch the database tables
- [✅] Identify the 8-9 main tables you need
- [✅] For each table, list:
  - Table name
  - Columns (name, data type, constraints)
  - Primary keys
  - Foreign keys
- [✅] Define relationships:
  - One-to-many (e.g., one course has many videos)
  - Many-to-many (if any)
- [✅] Review with your partner - does it make sense?

**Deliverables:**
- Hand-drawn or digital ERD (Entity Relationship Diagram)
- List of tables with columns

**Tools to use:**
- draw.io (free)
- dbdiagram.io (free)
- Or just pen and paper!

---

### Day 4: Database Design (Part 2)
**Goals:** Refine database and create SQL

**Tasks:**
- [✅] Morning standup: Show your ERD
- [✅] Get feedback on your database design
- [✅] Refine the ERD based on feedback
- [✅] Write the SQL CREATE TABLE statements for all tables
- [✅] Include:
  -✅Primary keys
  -✅Foreign keys with proper constraints
  -✅NOT NULL where appropriate
  -✅DEFAULT values where needed
- [✅] Test your SQL in DB Browser for SQLite
- [✅] Add sample data (INSERT statements) for testing
- [✅] Commit to GitHub: `database/schema.sql`

**Deliverables:**
- Refined ERD
- Complete schema.sql file
- Sample data in database

---

### Day 5: UI/UX Design - Wireframes
**Goals:** Design what the application will look like

**Tasks:**
- [✅] Morning standup: Demo your working database
- [✅] Sketch wireframes for 6 key pages:
  1. Login page
  2. User course catalog
  3. Course detail page (with videos)
  4. Quiz page
  5. Certificate download page
  6. Admin dashboard
- [✅] For each wireframe, show:
  - Header/navigation
  - Main content area
  - Buttons and forms
  - BizTrack branding colors
- [✅] Can use: Figma (free), Balsamiq, or hand-drawn
- [✅] Review wireframes with your partner
- [✅] Get feedback from BizTrack mentor

**Deliverables:**
- 6 wireframe designs
- Notes on user flow (what happens when user clicks buttons)

---

### Day 6: Technical Architecture & Setup
**Goals:** Plan the code structure and set up development environment

**Tasks:**
- [✅] Morning standup: Show wireframes
- [✅] Create project folder structure:
```
biztrack-learning-hub/
├── app/
│   ├── __init__.py
│   ├── models.py          # Database models
│   ├── routes.py          # URL routes
│   ├── forms.py           # Forms
│   └── templates/         # HTML files
│       ├── base.html
│       ├── login.html
│       └── ...
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       └── biztrack-logo.png
├── tests/
│   └── test_basic.py
├── database/
│   └── schema.sql
├── requirements.txt       # Python packages
├── config.py             # Configuration
├── run.py               # Run the app
└── README.md
```
- [✅] Set up Python virtual environment
- [✅] Install Flask and required packages
- [✅] Create requirements.txt
- [✅] Write basic Flask app that shows "Hello BizTrack!"
- [✅] Commit everything to GitHub

**Deliverables:**
- Complete project structure
- Working "Hello World" Flask app

---

### Day 7: Week 1 Review & Planning
**Goals:** Review what you've done and plan Week 2

**Tasks:**
- [✅] Morning standup: Demo your project setup
- [✅] Compile all Week 1 deliverables:
  - Requirements document ✓
  - User stories ✓
  - Database ERD ✓
  - schema.sql ✓
  - Wireframes ✓
  - Project structure ✓
- [✅] **Week 1 Review Meeting** with BizTrack team
- [✅] Present your designs and get feedback
- [✅] Make a list of changes needed
- [✅] Create a detailed plan for Week 2:
  - Which features to build first?
  - Who will work on what?
- [✅] Update GitHub with all documentation

**Deliverables:**
- Week 1 presentation
- Week 2 detailed plan
- Updated GitHub repository

---

## Week 2: Development (Days 8-14)

### Day 8: Database Integration & User Authentication
**Goals:** Connect database and create login system

**Tasks:**
- [✅] Morning standup: Share Week 2 plan
- [✅] Integrate SQLAlchemy with Nodejs
- [✅] Create database models in `models.py`:
  - User model
  - Course model
  - Video model
- [✅] Set up Flask-Login
- [✅] Create login page
- [✅] Test: Can create login
- [✅] Create admin user in database (is_admin=True)
- [✅] Commit to GitHub

**Deliverables:**
- Working login/logout
- Admin user created

---

### Day 9: Admin - Course Management
**Goals:** Admin can create and manage courses

**Tasks:**
- [✅] Morning standup: Demo login system
- [✅] Create admin dashboard page (only admins can access)
- [✅] Create "Add Course" form:
  - Course title
  - Course description
  - Submit button
- [✅] Implement course creation (save to database)
- [✅] Display list of courses on admin dashboard
- [✅] Add edit and delete buttons (implement later if time)
- [✅] Test: Create 3 sample courses
- [✅] Style with Bootstrap and BizTrack colors
- [✅] Commit to GitHub

**Deliverables:**
- Admin can create courses
- Courses display in admin dashboard
- 3 sample courses in database

---

### Day 10: Admin - Video Management
**Goals:** Admin can add videos to courses

**Tasks:**
- [✅] Morning standup: Demo course creation
- [✅] Create "Add Video" form:
  - Video title
  - Video URL (YouTube/Vimeo embed link)
  - Course selection (dropdown)
  - Order number
- [✅] Implement video creation (save to database)
- [✅] Display videos under each course in admin dashboard
- [✅] Test embedding a YouTube video
- [✅] Test: Add 3-4 videos to your sample courses
- [✅] Commit to GitHub

**Deliverables:**
- Admin can add videos to courses
- Videos linked to correct courses
- Sample videos in database

---

### Day 11: User - Course Catalog & Video Player
**Goals:** Users can browse courses and watch videos

**Tasks:**
- [✅] Morning standup: Demo admin video management
- [✅] Create user course catalog page
- [✅] Display all courses with:
  - Title
  - Description
  - Number of videos
  - "Start Course" button
- [✅] Create course detail page showing:
  - Course info
  - List of videos
  -[✅]User's progress (how many videos completed)
- [[✅]] Create video player page:
  - Embed YouTube/Vimeo video
  - "Mark as Complete" button
  - Next video button
- [✅] Implement progress tracking:
  - When user marks video complete, save to database
  - Show checkmarks on completed videos
- [✅] Test complete user flow
- [✅] Commit to GitHub

**Deliverables:**
- Course catalog page
- Video player with progress tracking
- User can mark videos complete

---

### Day 12: Admin - Quiz Creation
**Goals:** Admin can create quizzes with questions

**Tasks:**
- [✅] Morning standup: Demo user course pages
- [✅] Create "Add Quiz" form:
  - Quiz title
  - Course selection
  - Passing score (default 80%)
- [✅] Create "Add Question" form:
  - Question text
  - 4 answer options
  - Indicate correct answer
  - Quiz selection
- [✅] Implement quiz and question creation
- [✅] Admin can see all quizzes and their questions
- [✅] Test: Create 1 quiz with 5 questions for a sample course
- [✅] Commit to GitHub

**Deliverables:**
- Admin can create quizzes
- Admin can add questions to quizzes
- Sample quiz with 5 questions

---

### Day 13: User - Take Quiz & Scoring
**Goals:** Users can take quizzes and see results

**Tasks:**
- [✅] Morning standup: Demo quiz creation
- [✅] Create quiz page for users:
  - Display questions one at a time or all at once
  - Show 4 answer options (radio buttons)
  - Submit button
- [✅] Implement quiz scoring:
  - Calculate score (correct answers / total questions)
  - Save attempt to database
  - [❌] Show results page with:
    - Score percentage
    - Pass/fail message
    - Which questions were wrong
    - Correct answers
- [✅] Only allow quiz after all videos are complete
- [✅] Allow retaking if score < 80%
- [✅] Test full flow
- [✅] Commit to GitHub

**Deliverables:**
- Working quiz interface
- Score calculation
- Results page
- Retake functionality

---

### Day 14: Week 2 Review & Mid-Project Demo
**Goals:** Demo working application, get feedback

**Tasks:**
- [✅] Morning standup: Demo quiz system
- [✅] Prepare demo presentation
- [✅] **Week 2 Review Meeting** - Live demo:
  - Admin creates a course
  - Admin adds videos
  - Admin creates a quiz
  - User logs in
  - User watches videos
  - User takes quiz
  - User sees results
- [✅] Get feedback and note any bugs
- [✅] Create a bug list and prioritize
- [✅] Plan Week 3 tasks
- [✅] Commit all code to GitHub

**Deliverables:**
- Working demo
- Bug list
- Week 3 plan

---

## Week 3: Testing, Polish & Documentation (Days 15-21)

### Day 15: Certificate Generation
**Goals:** Generate PDF certificates for passing users

**Tasks:**
- [✅] Morning standup: Review feedback from demo
- [✅] Install ReportLab or WeasyPrint
- [✅] Design certificate template:
  - BizTrack logo
  - "Certificate of Completion"
  - User name
  - Course name
  - Date
  - Score
  - Signature line
  - BizTrack turquoise color scheme
- [✅] Implement certificate generation:
  - Trigger when quiz score >= 80%
  - Save PDF to database or file system
  - Record in certificates table
- [✅] Create certificate download page
- [✅] Test: Complete course and download certificate
- [✅] Commit to GitHub

**Deliverables:**
- PDF certificate generation working
- Certificate uses BizTrack branding
- User can download certificate

---

### Day 16: Testing & Bug Fixes
**Goals:** Test all features and fix bugs

**Tasks:**
- [✅] Morning standup: Demo certificate generation
- [✅] Write unit tests using pytest:
  - Test user registration
  - Test login
  - Test course creation
  - Test quiz scoring calculation
- [✅] Manual testing checklist:
  - [✅] User can register
  - [✅] User can login
  - [✅] Admin can create course
  - [✅] Admin can add videos
  - [✅] Admin can create quiz
  - [✅] User can watch videos
  - [✅] User can mark videos complete
  - [✅] User can take quiz
  - [✅] Scoring works correctly
  - [✅] Certificate generates for passing score
  - [✅] User can download certificate
- [✅] Fix all bugs found
- [✅] Test edge cases:
  - What if user enters empty form?
  - What if video URL is invalid?
  - What if user tries to take quiz before completing videos?
- [✅] Commit fixes to GitHub

**Deliverables:**
- Test file with passing tests
- All major bugs fixed
- Edge cases handled

---

### Day 17: UI Polish & Responsive Design
**Goals:** Make the app look professional

**Tasks:**
- [✅] Morning standup: Share test results
- [✅] Review all pages for consistency
- [✅] Apply BizTrack colors throughout:
  - Primary buttons: turquoise (#00A79D)
  - Headers: black with turquoise accents
  - Hover states
- [✅] Add BizTrack logo to navigation
- [✅] Improve forms:
  - Better labels
  - Helpful error messages
  - Input validation
- [✅] Make responsive (test on mobile view):
  - Use Bootstrap grid
  - Ensure buttons are clickable on mobile
  - Videos display properly
- [✅] Add loading states and success messages
- [✅] Improve navigation (breadcrumbs, back buttons)
- [✅] Commit to GitHub

**Deliverables:**
- Professionally styled interface
- Consistent BizTrack branding
- Responsive design

---

### Day 18: Documentation - User Guide
**Goals:** Write documentation for end users

**Tasks:**
- [ ] Morning standup: Demo polished UI
- [ ] Create User Guide document:
  - How to register and login
  - How to browse courses
  - How to watch videos and track progress
  - How to take a quiz
  - How to download a certificate
  - Screenshots for each step
- [ ] Create Admin Guide:
  - How to create a course
  - How to add videos
  - How to create a quiz
  - How to view user progress
  - Screenshots
- [ ] Test documentation by having someone follow it
- [ ] Save as PDF or Markdown in `docs/` folder
- [ ] Commit to GitHub

**Deliverables:**
- User guide with screenshots
- Admin guide with screenshots

---

### Day 19: Documentation - Technical & Setup
**Goals:** Write documentation for developers

**Tasks:**
- [ ] Morning standup: Share user documentation
- [ ] Update README.md with:
  - Project description
  - Features list
  - Tech stack
  - Setup instructions:
    - Clone repository
    - Install Python dependencies
    - Set up database
    - Run the application
  - Environment variables needed
  - How to run tests
- [ ] Add code comments:
  - Docstrings for all functions
  - Inline comments for complex logic
- [ ] Create `CONTRIBUTING.md` if others might work on it
- [ ] Add sample `.env.example` file
- [ ] Commit to GitHub

**Deliverables:**
- Complete README.md
- Code comments
- Setup instructions tested

---

### Day 20: Final Testing & Demo Preparation

**Goals:** Ensure everything works perfectly

**Tasks:**
- [ ] Morning standup: Final check
- [ ] Complete end-to-end testing:
  - Fresh database setup
  - Create admin user
  - Admin creates 2 courses
  - Admin adds 3 videos per course
  - Admin creates quiz per course
  - User registers
  - User completes Course 1
  - User takes and passes quiz
  - User downloads certificate
- [ ] Test on a different computer (if possible)
  - Verify setup instructions work
  - Make sure someone else can run it
- [ ] Fix any remaining issues
- [ ] Prepare final presentation:
  - 10-15 minute demo
  - Show the business problem
  - Demo key features
  - Share lessons learned
  - Discuss challenges and solutions
- [ ] Create presentation slides
- [ ] Practice demo with your partner
- [ ] Commit final version to GitHub

**Deliverables:**
- Fully tested application
- Final presentation ready
- Clean GitHub repository

---

### Day 21: Final Demo & Reflection
**Goals:** Present your work and reflect on learning

**Tasks:**
- [ ] Morning standup: Final check
- [ ] **Final Demo Presentation** to BizTrack team:
  - Present slides
  - Live demo
  - Q&A session
- [ ] Get feedback and suggestions
- [ ] Write individual reflection (1-2 pages):
  - What you learned
  - Challenges faced and how you overcame them
  - What you would do differently
  - How this experience prepared you for work
  - Skills you gained
- [ ] Thank the BizTrack team
- [ ] Submit all deliverables:
  - GitHub repository URL
  - Documentation
  - Reflection paper
- [ ] Celebrate! 🎉

**Deliverables:**
- Final presentation
- Complete working application
- Reflection paper
- All documentation

---

## Daily Standup Template

Use this format every morning (15 minutes):

**Yesterday I:**
- [What you accomplished]

**Today I will:**
- [Tasks you plan to complete]

**Blockers:**
- [Anything stopping you from making progress]

**Questions:**
- [Any questions for the team]

---

## Weekly Review Template

Use this for end-of-week demos:

1. **Recap:** What we planned to accomplish this week
2. **Demo:** Live demonstration of what we built
3. **Challenges:** Problems we encountered and how we solved them
4. **Learnings:** New things we learned
5. **Next Week:** Plan for the coming week

---

## Tips for Success

✅ **Commit to GitHub daily** - Even small progress  
✅ **Test as you build** - Don't wait until the end  
✅ **Ask questions early** - Don't struggle for hours  
✅ **Take breaks** - Better code comes from a fresh mind  
✅ **Help each other** - Two heads are better than one  
✅ **Document while coding** - Easier than doing it later  
✅ **Focus on working code** - Perfect code can come later  
✅ **Celebrate small wins** - Every feature completed is progress!

---

## Emergency Contact

If you're stuck for more than 1 hour on the same problem:
1. Google the error message
2. Check Stack Overflow
3. Ask your partner
4. Message your mentor
5. Don't stay stuck - ask for help!

Good luck! You've got this! 💪
