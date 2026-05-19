# Day 2: User Story Workshop
## Learn By Doing - Create Your Requirements Document

**Time Required:** 3-4 hours  
**Deliverable:** Complete requirements document with 15-20 user stories  
**Format:** Work through this guide step-by-step  

---

## Part 1: Understanding User Stories (30 minutes)

### What Is a User Story?

A user story is a simple sentence that describes **WHO** needs **WHAT** and **WHY**.

**Template:**
```
As a [type of user],
I want to [do something],
So that [I achieve some goal].
```

### Example from BizTrack Learning Hub:

**Bad Requirement (Old Way):**
"The system shall implement a video playback mechanism with progress tracking functionality."

❌ **Problem:** Too technical, doesn't explain who or why

**Good User Story (New Way):**
```
As a BizTrack user,
I want to watch training videos and see my progress,
So that I know how much of the course I've completed.
```

✅ **Better:** Clear who, what, and why!

---

## Part 2: Identify Your Users (15 minutes)

### EXERCISE 1: List All User Types

For BizTrack Learning Hub, who will use your system?

**Write down all user types here:**

1. _________________ (Hint: who manages the content?)
2. _________________ (Hint: who takes the training?)
3. _________________ (Optional: are there any other roles?)

**Answer:**
1. BizTrack Admin
2. BizTrack User (learner)

---

## Part 3: Brainstorm Features (30 minutes)

### EXERCISE 2: What Can Each User Do?

#### For BizTrack Admin:

Think about what an admin needs to do to run a training platform.

**List at least 7 admin actions:**

1. Create ________________
2. Add _________________ to courses
3. Create ________________
4. Add _________________ to quizzes
5. View _________________
6. See _________________
7. Manage _________________

#### For BizTrack User:

Think about what a learner needs to do to get trained.

**List at least 8 user actions:**

1. Browse _________________
2. Watch _________________
3. Mark videos as _________________
4. Take _________________
5. See quiz _________________
6. Download _________________
7. Track my _________________
8. Retake _________________

**Pro Tip:** Look at the project brief for hints!

---

## Part 4: Write Your First User Story (20 minutes)

### EXERCISE 3: Guided Story Writing

Let's write one complete user story together.

**Scenario:** An admin needs to create a new training course.

**Step 1: Identify the user type**
Who is doing this action? _________________

**Step 2: What do they want to do?**
What specific action? _________________

**Step 3: Why do they want to do it?**
What's the benefit or goal? _________________

**Step 4: Combine into story format**

```
As a _________________,
I want to _________________,
So that _________________.
```

**Step 5: Add Acceptance Criteria**

What must be true for this story to be "done"?

- [ ] Admin can enter _________________
- [ ] Admin can add _________________
- [ ] Course is saved to _________________
- [ ] Admin sees _________________ message
- [ ] Course appears in _________________

---

## Part 5: Practice - Write 3 Stories (30 minutes)

### EXERCISE 4: Your Turn!

Write 3 complete user stories with acceptance criteria:

### Story #1: Admin Creates a Quiz

```
As a _________________,
I want to _________________,
So that _________________.

Acceptance Criteria:
- [ ] _________________
- [ ] _________________
- [ ] _________________
- [ ] _________________
```

### Story #2: User Watches a Video

```
As a _________________,
I want to _________________,
So that _________________.

Acceptance Criteria:
- [ ] _________________
- [ ] _________________
- [ ] _________________
- [ ] _________________
```

### Story #3: User Takes a Quiz

```
As a _________________,
I want to _________________,
So that _________________.

Acceptance Criteria:
- [ ] _________________
- [ ] _________________
- [ ] _________________
- [ ] _________________
```

**Check Your Work:**
- Does each story start with "As a..."?
- Is the user type specific (not just "user")?
- Does it explain what AND why?
- Are acceptance criteria testable?
- Could a developer build this?

---

## Part 6: Create Your Complete List (60-90 minutes)

### EXERCISE 5: Write All 15-20 User Stories

Now create your complete requirements document. Use this structure:

---

## YOUR REQUIREMENTS DOCUMENT STARTS HERE

Copy this section to a new Google Doc or Markdown file.

---

# BizTrack Learning Hub - Requirements Document

**Created by:** [Your Names]  
**Date:** [Today's Date]  
**Project:** BizTrack Learning Hub  

## 1. Project Overview

**Purpose:** [1-2 sentences about what you're building]

**Problem:** [What problem does this solve for BizTrack?]

**Solution:** [How does your system solve this?]

---

## 2. User Types

| User Type | Description | Main Goals |
|-----------|-------------|------------|
| BizTrack Admin | Manages courses and content | Create training, track user progress |
| BizTrack User | Takes training courses | Learn the platform, get certified |

---

## 3. User Stories

### 3.1 Admin Stories (Course Management)

**STORY #1: Create a Course**

```
As a BizTrack admin,
I want to create new training courses,
So that users have organized content to learn from.

Acceptance Criteria:
- [ ] Admin can access "Create Course" button
- [ ] Admin can enter course title (max 200 characters)
- [ ] Admin can enter course description
- [ ] Course is saved to database
- [ ] Admin sees success confirmation
- [ ] New course appears in admin course list

Priority: Must Have
Estimated Effort: Small
```

---

**STORY #2: Add Videos to Course**

```
As a BizTrack admin,
I want to add training videos to courses,
So that users have content to watch and learn from.

Acceptance Criteria:
- [ ] [You fill in - what must be true?]
- [ ] [What can the admin do?]
- [ ] [Where is data saved?]
- [ ] [What does admin see?]
- [ ] [What else must work?]

Priority: Must Have
Estimated Effort: Medium
```

---

**STORY #3: _________________** (You create this one!)

```
As a _________________,
I want to _________________,
So that _________________.

Acceptance Criteria:
- [ ] _________________
- [ ] _________________
- [ ] _________________

Priority: _________________
Estimated Effort: _________________
```

---

### 3.2 Admin Stories (Quiz Management)

**Continue with 2-3 more stories about:**
- Creating quizzes
- Adding questions to quizzes
- Viewing user quiz results

---

### 3.3 User Stories (Learning)

**Write 3-4 stories about:**
- Browsing courses
- Watching videos
- Tracking progress
- Sequential video unlocking

---

### 3.4 User Stories (Assessment)

**Write 3-4 stories about:**
- Taking quizzes
- Viewing results
- Retaking quizzes
- Downloading certificates

---

### 3.5 System Stories (Authentication & Profile)

**Focus on API integration stories

---

## 4. Story Prioritization

Organize your stories by priority:

### Must Have (Core Features)
List story numbers that are absolutely essential:
- Story #1: Create courses
- Story #2: Add videos
- [Continue...]

### Should Have (Important but not critical)
List story numbers that are important:
- Story #__: _________________
- [Continue...]

### Nice to Have (If time permits)
List story numbers that would be cool extras:
- Story #__: _________________
- [Continue...]

---

## 5. Success Criteria

Our project is successful if:
- [ ] All "Must Have" stories are complete
- [ ] Users can complete a full course from start to certificate
- [ ] Admins can create and manage all content
- [ ] System is tested and working
- [ ] Documentation is complete

---

## END OF REQUIREMENTS DOCUMENT

---

## Part 7: Review Checklist (15 minutes)

### EXERCISE 6: Self-Assessment

Before submitting, check:

**Story Quality:**
- [ ] I have 15-20 complete user stories
- [ ] Each story has "As a / I want / So that"
- [ ] Each story has 3-5 acceptance criteria
- [ ] Stories are from user perspective (not developer)
- [ ] Stories explain the "why" (value/benefit)

**Coverage:**
- [ ] Admin can create courses (covered?)
- [ ] Admin can add videos (covered?)
- [ ] Admin can create quizzes (covered?)
- [ ] User can watch videos (covered?)
- [ ] User can take quizzes (covered?)
- [ ] User can get certificates (covered?)
- [ ] Authentication/login (covered?)

**Clarity:**
- [ ] A developer could build this from my stories
- [ ] Each story is specific and testable
- [ ] No technical jargon in the stories
- [ ] Acceptance criteria are clear

**Organization:**
- [ ] Stories are grouped logically
- [ ] Stories are prioritized
- [ ] Document is well-formatted

---

## Part 8: Review with Your Partner (30 minutes)

### EXERCISE 7: Peer Review

**Swap documents with your partner.**

**Review each other's stories:**

For each story, ask:
1. Do I understand who the user is?
2. Do I understand what they want to do?
3. Do I understand why they want to do it?
4. Could I test if this is complete?
5. Is anything missing?

**Give feedback:**
- 2 things that are really good ✅
- 2 things that could be improved 🔄
- 1 question you have ❓

**Revise your document based on feedback.**

---

## Part 9: Present to Mentor (15 minutes)

### EXERCISE 8: Standup Presentation

**Prepare to share:**

1. **How many stories did you write?** _____
2. **What was easiest to write?** _________________
3. **What was hardest?** _________________
4. **Show your top 3 "Must Have" stories**
5. **Any questions or concerns?**

---

## Common Mistakes & How to Fix Them

### Mistake #1: Too Technical

❌ **Wrong:**
"As a developer, I want to implement a PostgreSQL database, so that data is stored."

✅ **Fixed:**
"As a BizTrack admin, I want to save course information, so that it's available for users."

---

### Mistake #2: Missing the "Why"

❌ **Wrong:**
"As a user, I want to click a button."

✅ **Fixed:**
"As a user, I want to mark a video as complete, so that I can track my progress."

---

### Mistake #3: Too Vague

❌ **Wrong:**
"As a user, I want to use the system."

✅ **Fixed:**
"As a user, I want to browse available courses by category, so I can find relevant training quickly."

---

### Mistake #4: Multiple Actions in One Story

❌ **Wrong:**
"As an admin, I want to create courses, add videos, create quizzes, and view reports, so that I can manage training."

✅ **Fixed:** Split into 4 separate stories!

---

## Tips for Great User Stories

### DO ✅
- Be specific about the user type
- Focus on user value, not technical implementation
- Write from user's perspective
- Make acceptance criteria testable
- Keep stories small and focused
- Explain the benefit (the "so that")

### DON'T ❌
- Use technical jargon
- Write from developer perspective
- Make stories too big
- Forget acceptance criteria
- Skip the "so that" part
- Combine multiple features

---

## Quick Reference: Story Template

```
STORY #[number]: [Short descriptive title]

As a [specific user type],
I want to [specific action],
So that [specific benefit].

Acceptance Criteria:
- [ ] [Specific testable condition]
- [ ] [Specific testable condition]
- [ ] [Specific testable condition]
- [ ] [Specific testable condition]

Priority: [Must Have / Should Have / Nice to Have]
Estimated Effort: [Small / Medium / Large]
Notes: [Any additional context]
```

---

## End of Day 2 Deliverable

### What to Submit:

1. **Requirements Document** (Google Doc or Markdown)
   - Project overview
   - User types
   - 15-20 user stories with acceptance criteria
   - Story prioritization
   - Success criteria

2. **Reflection** (5 minutes)
   - What did you learn about requirements?
   - What surprised you?
   - What questions do you still have?

---

## Next Steps (Day 3)

Tomorrow you'll use these user stories to:
- Design your database (what data do you need to store?)
- Create wireframes (what does each story look like?)
- Plan your architecture (how will you build this?)

**Your user stories are the foundation for everything!**

---

## Need Help?

**Stuck on a story?** Ask:
1. Who is the user?
2. What are they trying to accomplish?
3. Why does it matter to them?

**Can't think of stories?** Look at:
- The project brief features list
- The sample quiz questions (what features do they need?)
- Other LMS platforms for inspiration

**Stories too technical?** Remove words like:
- Database, API, framework, SQL, code
- Replace with user benefits

---

**Good luck! You're building the blueprint for your entire project!** 🎯

*Remember: Good requirements = Good software*
