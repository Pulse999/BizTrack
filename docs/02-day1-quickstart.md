# Day 1 Quick Start Guide 🚀

Welcome to your BizTrack Learning Hub project! This guide will help you get started on Day 1.

## Morning (9:00 AM - 12:00 PM)

### 1. Project Kickoff Meeting (30 minutes)
**With:** BizTrack team  
**Goals:**
- Meet the team
- Understand BizTrack's business
- Learn about current training challenges
- Ask questions about the project

**Questions to Ask:**
1. What are the biggest challenges with user training right now?
2. What features are most important to you?
3. Who will be our main contact person?
4. How often would you like updates?
5. Can we see the current BizTrack platform?

---

### 2. Read & Understand Project Documents (60 minutes)
**What to Read:**
- [✔️] Project Brief - Understand what you're building
- [✔️] Weekly Task Breakdown - See the plan for 3 weeks
- [✔️] Database Schema - Look at the tables
- [✔️] Evaluation Rubric - Know how you'll be assessed

**Make Notes:**
- Write down things you don't understand
- List questions for your mentor
- Highlight features that seem challenging

---

### 3. Set Up Your Workspace (30 minutes)

#### Create GitHub Repository
```bash
# One person creates the repo on github.com
# Name: biztrack-learning-hub
# Description: Learning Management System for BizTrack user training
# Make it Public
# Add README, .gitignore (Python), and License (MIT)

# Both people clone it
git clone https://github.com/YOUR-USERNAME/biztrack-learning-hub.git
cd biztrack-learning-hub
```

#### Create Project Folder Structure
```bash
# Create folders
mkdir app static database tests docs certificates
mkdir static/css static/js static/images
mkdir app/templates
mkdir app/templates/admin app/templates/user

# Create initial files
touch app/__init__.py
touch app/models.py
touch app/routes.py
touch run.py
touch config.py
touch requirements.txt
touch .env.example
touch .gitignore
```

#### Create .gitignore
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/

# Flask
instance/
.env

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Certificates
certificates/*.pdf
```

---

## Afternoon (1:00 PM - 5:00 PM)

### 4. Install Development Tools (30 minutes)

#### Install Python (if not already installed)
```bash
# Check Python version
python --version
# Should be 3.9 or higher

# If not installed:
# Windows: Download from python.org
# Mac: brew install python3
# Linux: sudo apt install python3
```

#### Install VS Code Extensions (Recommended)
- Python
- Pylance
- SQLite Viewer
- GitLens
- Prettier

---

### 5. Create Initial Files (90 minutes)

#### requirements.txt
```
Flask==2.3.0
Flask-SQLAlchemy==3.0.5
Flask-Login==0.6.2
python-dotenv==1.0.0
Werkzeug==2.3.0
reportlab==4.0.0
pytest==7.4.0
pytest-cov==4.1.0
```

#### config.py
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///biztrack_learning.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
```

#### .env.example
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///biztrack_learning.db
FLASK_ENV=development
FLASK_DEBUG=True
```

#### app/__init__.py
```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'login'
    
    return app
```

#### run.py
```python
from app import create_app, db

app = create_app()

@app.route('/')
def hello():
    return '<h1 style="color: #00A79D;">Hello BizTrack! 🚀</h1>'

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
```

---

### 6. Test Your Setup (20 minutes)

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run the app
python run.py
```

**Open browser:** http://localhost:5000

You should see: "Hello BizTrack! 🚀" in turquoise!

✅ **Success!** Your development environment is ready!

---

### 7. Create Questions Document (30 minutes)

Create a Google Doc called "BizTrack LMS - Questions & Notes"

**Write down:**
1. **Technical Questions**
   - Any setup issues?
   - Tools you're unfamiliar with?
   - Concepts you need to understand better?

2. **Project Questions**
   - Unclear requirements?
   - Features you need clarification on?
   - Timeline concerns?

3. **BizTrack Business Questions**
   - What do users struggle with most?
   - Who are the typical BizTrack users?
   - What's the current training process?

Share this document with your mentor for tomorrow's standup.

---

### 8. First Git Commit (20 minutes)

```bash
# Add all files
git add .

# Commit
git commit -m "Initial project setup - Day 1

- Created project structure
- Added Flask app skeleton
- Set up virtual environment
- Created requirements.txt
- Added .gitignore
- Hello BizTrack homepage working"

# Push to GitHub
git push origin main
```

---

### 9. End of Day Update (10 minutes)

**Prepare to share with your mentor:**
- ✅ What you completed today
- ❓ Questions for tomorrow
- 📅 Plan for tomorrow (Day 2)

**Day 1 Achievements Checklist:**
- [✔️] Attended kickoff meeting
- [✔️] Read all project documents
- [✔️] Created GitHub repository
- [✔️] Set up project folder structure
- [✔️] Installed Python and tools
- [✔️] Created initial files
- [✔️] Got "Hello BizTrack" running
- [✔️] Created questions document
- [✔️] Made first Git commit
- [✔️] Prepared end-of-day update

---

## Tomorrow (Day 2) Preview

**Morning:**
- Stand-up meeting (9:00 AM)
- Get answers to your questions
- Start writing user stories

**Goals:**
- Create comprehensive requirements document
- Write 15+ user stories
- Define acceptance criteria
- Prioritize features

**Prep:**
- Review the project brief again
- Think about the user experience
- Consider edge cases

---

## Tips for Success

✅ **Ask Questions** - No question is too small  
✅ **Commit Often** - Save your work frequently  
✅ **Take Breaks** - Better code comes from a fresh mind  
✅ **Help Each Other** - You're a team!  
✅ **Document** - Write notes as you learn  
✅ **Test** - Make sure things work before moving on  

---

## Common Day 1 Issues & Solutions

### Issue: Python not found
**Solution:** Make sure Python is in your PATH. Restart terminal after installation.

### Issue: pip install fails
**Solution:** Make sure virtual environment is activated. Look for `(venv)` in terminal.

### Issue: Flask app won't run
**Solution:** 
- Check if port 5000 is already in use
- Make sure all files are saved
- Check for typos in code

### Issue: Git push fails
**Solution:**
- Make sure you're added as collaborator on GitHub
- Check you're logged into Git: `git config user.name`
- Try `git pull` first, then `git push`

---

## Resources

**Python/Flask:**
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Python Tutorial](https://docs.python.org/3/tutorial/)

**Git:**
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Guides](https://guides.github.com/)

**Bootstrap:**
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.0/)

**Help:**
- Stack Overflow
- Your mentor
- Each other!

---

## End of Day 1 Reflection

Before you finish, take 10 minutes to write:

1. **What I learned today:**
   - How to set up a Flask project from scratch
   - Using virtual environments and requirements.txt
   - Basic Git workflow (clone, commit, push)


2. **What went well:**
   - Successfully created the project structure
   - Got the Flask app running locally
   - Collaborated smoothly with my teammate

3. **What was challenging:**
   - Activating the virtual environment in Git Bash
   - Understanding some of the initial requirements

4. **Questions for tomorrow:**
   - How should we design the user stories?
   - What are the most important features to prioritize?
   - Any tips for working with SQLAlchemy?

5. **I'm excited about:**
   - Building out the LMS features
   - Learning more about Flask and web development
   - Working as a team on a real project

---

**Congratulations on completing Day 1!** 🎉

You've taken the first step in building a real application for a real company. Tomorrow, you'll start designing the actual system. Get some rest - you've earned it!

See you at standup tomorrow at 9:00 AM!

**- BizTrack Learning Hub Team**

---

*Remember: This is a learning experience. Mistakes are part of the process. Ask questions, help each other, and have fun building something awesome!* 🚀
