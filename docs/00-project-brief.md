# BizTrack Learning Hub - Project Brief

## Project Overview

**Project Name:** BizTrack Learning Hub  
**Duration:** 21 days (3 weeks)  
**Team:** Thembinkosi Kene & Jan Lodewyk Pretorius  
**Company:** BizTrack  

### What You'll Build

A mini Learning Management System (LMS) that allows BizTrack to:
- Upload training videos for users
- Create quizzes to test user knowledge
- Track user progress through courses
- Issue certificates upon successful completion
- Monitor which users need additional training

---

## Business Problem

BizTrack needs a way to:
1. Train new users on how to use the platform effectively
2. Ensure users understand key features before they start using them
3. Reduce support requests by providing comprehensive training
4. Issue certificates to show user competency
5. Track which areas users struggle with most

---

## Learning Outcomes

By completing this project, you will:
- ✅ Design a complete database schema from scratch
- ✅ Build a full-stack web application
- ✅ Integrate with external APIs (BizTrack authentication)
- ✅ Work with video content and file handling
- ✅ Create a PDF certificate generation system
- ✅ Write tests to ensure your code works correctly
- ✅ Document your code professionally
- ✅ Present your work to stakeholders
- ✅ Use Git for version control
- ✅ Apply software engineering best practices

---

## Core Features (MVP)

### 1. Admin Dashboard
**Who:** BizTrack staff  
**Can:**
- Create and manage courses
- Add training videos to courses (using YouTube/Vimeo links)
- Create quizzes with multiple-choice questions
- View user completion rates
- See average quiz scores
- Download reports on user progress

### 2. User Course Catalog
**Who:** BizTrack users  
**Can:**
- Browse available courses
- See course descriptions and video count
- View their own progress on each course
- See which courses they've completed

### 3. Video Player & Progress Tracking
**Who:** BizTrack users  
**Can:**
- Watch training videos
- Mark videos as complete
- See their progress through the course
- Videos unlock sequentially (complete video 1 before watching video 2)

### 4. Quiz System
**Who:** BizTrack users  
**Can:**
- Take quizzes after completing course videos
- See immediate results
- Retake quizzes if they fail (under 80%)
- See correct answers after completion

### 5. Certificate Generation
**Who:** BizTrack users  
**Can:**
- Automatically receive a certificate when passing a course quiz (80%+)
- Download certificate as PDF
- Certificate includes: User name, Course name, Date, Score, BizTrack branding

---
## BizTrack API Integration

### Overview

Instead of building a separate authentication system, you'll integrate with BizTrack's existing user authentication API. This means:
- ✅ Users log in with their existing BizTrack credentials
- ✅ No separate registration needed
- ✅ User data automatically synced from BizTrack
- ✅ Single sign-on experience
- ✅ Real-world API integration practice

### Authentication Endpoint

**URL:** `https://stage.biztrack.co.za/php/api/merchy_api/universal_login`

**Method:** POST

**Content-Type:** application/x-www-form-urlencoded

**Required Fields:**
- `Email` - User's BizTrack email
- `Password` - User's BizTrack password
- `DeviceType` - Set to "1" (web application)
- `DeviceID` - Can be empty string for web
- `Key` - API key: `BizTrack@123#WebAPI`
- `FirebaseToken` - Can be empty string
- `BuildVersion` - Your app version (e.g., "1.0")

**Example Request Body:**
```
Email=merchie111@biztrack.co.za
Password=BizPa$$9!!
DeviceType=1
DeviceID=
Key=BizTrack@123#WebAPI
FirebaseToken=
BuildVersion=1.0
```

**Successful Response (200):**
```json
{
  "code": 200,
  "message": "Success",
  "tblUser": {
    "UserID": 12492,
    "Firstname": "Merchie",
    "Lastname": "Learning Platform",
    "Email": "merchie111@biztrack.co.za"
  },
  "tblCompany": {
    "CompanyID": 8,
    "Name": "BizTrack Demo 1"
  }
}
```

**Failed Response:**
```json
{
  "code": 401,
  "message": "Invalid credentials"
}
```

### How Authentication Works

Instead of building your own login system, you'll integrate with BizTrack's existing authentication:

**Login Flow:**
1. User enters email and password in YOUR login form
2. YOUR app sends POST request to BizTrack API:
   - URL: https://stage.biztrack.co.za/php/api/merchy_api/universal_login
   - Body: Email, Password, DeviceType, DeviceID, Key, etc.
3. BizTrack API responds with user data (UserID, name, email, company)
4. YOUR app:
   - Checks if `biztrack_user_id` exists in YOUR users table
   - If NO: Create new user record with their BizTrack data
   - If YES: Update their `last_login` timestamp
   - Create a session for them in YOUR app
5. User is now logged into YOUR Learning Hub

**Benefits:**
✅ No password management needed  
✅ Uses existing BizTrack credentials  
✅ Automatic sync with BizTrack user data  
✅ Real-world API integration practice  
✅ Single sign-on experience  

**What You Store:**
- `biztrack_user_id` (links to BizTrack)
- Their name and email (from API response)
- Their role in Learning Hub (`is_admin`)
- Their learning progress (videos, quizzes, certificates)

**What You DON'T Store:**
❌ Passwords (BizTrack handles this)  
❌ BizTrack company details (just the ID for reference)  

### Implementation Notes

1. **On Successful Login:**
   - Extract `UserID` from `tblUser.UserID`
   - Check if user exists in your `users` table (by `biztrack_user_id`)
   - If new user: Create record with BizTrack data
   - If existing user: Update `last_login` timestamp
   - Create session in your Flask app
   - Redirect to dashboard

2. **Session Management:**
   - Use Flask-Login for session management
   - Store `biztrack_user_id` in session
   - Don't store passwords anywhere

3. **Admin Assignment:**
   - Decide which BizTrack users should be admins
   - Set `is_admin=1` manually in database for BizTrack staff
   - OR check if user's email matches a list of admin emails

4. **Testing:**
   - Use Postman to test the API first (see API Testing Guide)
   - Test account: merchie111@biztrack.co.za / BizPa$$9!!
   - Understand the response before coding

---


## Technical Stack

### Backend
- **Python 3.9+**
- **Flask** - Web framework
- **SQLAlchemy** - Database ORM
- **Flask-Login** - User session management
- **requests** - For calling BizTrack API
- **ReportLab** - PDF certificate generation

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Bootstrap 5** - Responsive design
- **JavaScript** - Interactivity

### Database
- **SQLite** (Development)

### Tools
- **Git/GitHub** - Version control
- **pytest** - Testing framework
- **Postman** - API testing
---

## Database Schema

See the separate "Database Schema" document for detailed table structures.

**Core Tables:**
- users
- courses
- videos
- quizzes
- questions
- answers
- user_progress
- quiz_attempts
- certificates

---

## User Roles

### Admin
- Create/edit/delete courses
- Add videos and quizzes
- View all user progress
- Download reports

### User (Default)
- View courses
- Watch videos
- Take quizzes
- Download certificates

---

## Success Criteria

Your project will be successful if:

1. **Functionality** (40%)
   - All core features work as described
   - No critical bugs
   - Smooth user experience
   - BizTrack API integration works

2. **Code Quality** (25%)
   - Clean, readable code
   - Proper use of functions and classes
   - Good variable naming
   - Comments where needed

3. **Database Design** (15%)
   - Proper relationships between tables
   - Good normalization
   - Efficient queries
   - Correct BizTrack integration fields

4. **Testing** (10%)
   - Key features have tests
   - Tests pass
   - Edge cases considered

5. **Documentation** (10%)
   - Setup instructions
   - User guide
   - Code comments

---

## Project Constraints

### Must Have
- User login via BizTrack API
- Course creation by admin
- Video embedding (YouTube)
- Quiz creation and taking
- Certificate generation
- Progress tracking

### Should Have
- Sequential video unlocking
- Passing score requirement (80%)
- Quiz retakes
- Admin dashboard with stats

### Nice to Have (if time permits)
- Feature request module
- Email notifications
- User profile pictures
- Course categories
- Search functionality

### Out of Scope
- Video uploading (use embeds instead)
- Payment processing
- Mobile app
- Advanced analytics
- Production deployment (runs on localhost)

---

## Deliverables

### Week 1
- Requirements document
- Database ERD (Entity Relationship Diagram)
- Wireframes for key pages (Use https://whimsical.com/)
- GitHub repository setup
- Project plan

### Week 2
- Working database with sample data
- Admin can create courses
- Admin can add videos and quizzes
- Users can watch videos
- Users can take quizzes
- Basic scoring works
- BizTrack API integration complete

### Week 3 Final Deliverables
- ✅ Complete working application (runs on localhost)
- ✅ All features tested and functional
- ✅ Complete GitHub repository with:
  - Clean, documented code
  - Database schema and setup scripts
  - Installation instructions in README
  - All tests passing
- ✅ User documentation (how to use the system)
- ✅ Technical documentation (how to run/install)
- ✅ Final presentation

**Note on Deployment:**
The application should run successfully on `localhost:5000`. 
BizTrack will handle production deployment separately.
Students must provide clear setup instructions so the application 
can be run on any computer.

---

## Getting Started

1. **Day 1:** Project kickoff meeting with BizTrack team
2. **Day 1-2:** Understand requirements, ask questions
3. **Day 3-5:** Design database and create wireframes
4. **Day 6-7:** Set up development environment and project structure
5. **Day 8:** Test BizTrack API and implement authentication
6. **Week 2:** Build, build, build!
7. **Week 3:** Test, polish, document, present

---

## Support & Communication

### Daily Standups
- **Time:** 9:00 AM (15 minutes)
- **Format:** What you did yesterday, plan for today, any blockers

### End of Day Updates
- **Time:** 4:00 PM (10 minutes)
- **Format:** Show progress, ask questions

### Weekly Reviews
- **Week 1:** Design review
- **Week 2:** Code review
- **Week 3:** Final demo

### Questions
- Ask anytime via your communication channel
- No question is too small
- Better to ask than to get stuck!

---

## Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/14/tutorial/)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

---

## Assessment Alignment

This project covers all your WIL module requirements:

- **Software Design (30 credits):** Architecture, database design, UI/UX
- **Database Design (20 credits):** Schema creation, relationships, queries
- **Software Development (30 credits):** Building the application
- **Software Testing (15 credits):** Writing and running tests

**Total:** 95 credits

---

## Important Notes

- **Commit often** - Push to GitHub daily
- **Test as you go** - Don't wait until the end
- **Ask questions early** - Don't struggle alone
- **Document while building** - Don't leave it for last
- **Focus on MVP first** - Get core features working before adding extras
- **Collaborate** - Work as a team, help each other
- **Test the BizTrack API in Postman before coding** - Understanding the API first saves time!

---

## Contact

**Mentor:** Gustaff Pain  
**Project Manager:** Gustaff Pain 
**Technical Support:** Available via Whatsapp

---

Good luck! We're excited to see what you build! 🚀
