# BizTrack Learning Hub - Quick Reference Card 🎓

## What You're Building
A Learning Management System where BizTrack admins create training courses and users earn certificates.

---

## 3-Week Timeline

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| **Week 1** | **Planning & Design** | Requirements doc, Database ERD, Wireframes, GitHub setup |
| **Week 2** | **Development** | Working app with all core features, Mid-project demo |
| **Week 3** | **Testing & Polish** | Certificates, Tests, Documentation, Final presentation |

---

## Core Features (Must Have)

### Admin Side
- ✅ Create courses
- ✅ Add training videos (YouTube/Vimeo embeds)
- ✅ Create quizzes with multiple-choice questions
- ✅ View user progress dashboard

### User Side
- ✅ Browse courses
- ✅ Watch videos & track progress
- ✅ Take quizzes (80% to pass)
- ✅ Download certificates

---

## Tech Stack

**Backend:** Python + Flask + SQLAlchemy  
**Frontend:** HTML + CSS + Bootstrap + JavaScript  
**Database:** SQLite  
**Testing:** pytest  
**Version Control:** Git/GitHub  

---

## BizTrack Branding

**Primary Color:** `#00A79D` (Turquoise)  
**Font:** TypoGraphica  
**Logo:** Use in navbar and certificates  

---

## Daily Routine

**9:00 AM** - Standup (15 mins)  
**9:15 AM - 12:00 PM** - Code  
**1:00 PM - 4:00 PM** - Code  
**4:00 PM** - End of day update (10 mins)  

---

## Success Tips

✅ Commit to GitHub **daily**  
✅ Test features **as you build** them  
✅ Ask questions **early**  
✅ Focus on **core features first**  
✅ Document **while you code**  
✅ Help **each other**  

---

## Assessment (95 Credits)

- **Software Design:** 30 credits (ERD, wireframes, architecture)
- **Database Design:** 20 credits (Schema design, relationships)
- **Software Development:** 30 credits (Code quality, features working)
- **Software Testing:** 15 credits (Tests, bug fixes, QA)

---

## Weekly Checkpoints

**Week 1 (Day 7):** Design Review - Show ERD, wireframes, plan  
**Week 2 (Day 14):** Mid-Project Demo - Live demo of working features  
**Week 3 (Day 21):** Final Presentation - Complete project + reflection  

---

## Main Database Tables (You Design These!)

1. **users** - Admin and regular users
2. **courses** - Training courses
3. **videos** - Course training videos
4. **quizzes** - Tests for each course
5. **questions** - Quiz questions
6. **answers** - Answer options (A, B, C, D)
7. **user_video_progress** - Track completed videos
8. **quiz_attempts** - Store quiz scores
9. **certificates** - Generated certificates

---

## Key Relationships

- One **course** has many **videos**
- One **course** has one or more **quizzes**
- One **quiz** has many **questions**
- One **question** has 4 **answers**
- Many **users** complete many **videos** (many-to-many)
- Many **users** take many **quizzes** (many-to-many)

---

## Important Resources

**Documentation:** All docs in GitHub repository  
**Help:** Stack Overflow, Flask docs, your mentor  
**Tools:** VS Code, DB Browser for SQLite, Git  
**Communication:** Daily standups, Slack/WhatsApp  

---

## Emergency Contact

**Stuck for 1+ hour?**  
1. Google the error
2. Check Stack Overflow
3. Ask your partner
4. Message your mentor

**Don't stay stuck - ask for help!**

---

## Week 1 Priorities

**Days 1-2:** Understand requirements, setup environment  
**Days 3-4:** Design database (ERD + SQL)  
**Days 5-6:** Design UI (wireframes)  
**Day 7:** Review & prepare for Week 2  

---

## Remember

📌 This is a **learning experience**  
📌 Mistakes are **part of the process**  
📌 The goal is **learning**, not perfection  
📌 You're building something **real** for a **real company**  
📌 Have fun and help each other! 🚀

---

**Students:** Thembinkosi Kene & Jan Lodewyk Pretorius  
**Company:** BizTrack  
**Institution:** CTU Training Solutions  
**Duration:** 21 days | November 2025  

*"Code with confidence. Learn with purpose. Build with pride."*
