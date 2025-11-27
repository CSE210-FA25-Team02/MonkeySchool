Meeting Notes 11/4

Attendance:

- [x] Annie Phan  
- [x] Abhiraj Srivastava  
- [x] Dingyi Yu  
- [x] Indresh Pradeepkumar  
- [x] Jeffrey Hata  
- [x] Juan Yin  
- [x] Lillian Liu  
- [x] Shravya Ramasahayam  
- [x] Shresth Grover  
- [x] Sneh Davaria  
- [x] Zihan Zhou

- Design documents  
  - ADR  
    - pro/con analysis  
- Before each sprint  
  - Review and retrospective on previous sprint  
- Breakdown GitHub tasks for this week  
- Review boilerplate PR (ADR needed)  
  - Linting  
  - Formatting checks / adjustments  
  - Unit testing  
  - Any code that we write gets run through this  
  - Coverage report  
  - Prisma for database models to auto-create tables   
  - Each added feature extend tables instead of fully defining tables now  
- Use Docker if don’t have postgres locally (ADR needed)  
- Branching  
  - Name: feat/”feature name”  
  - Commit message: feat: “” closes issue \#  
  - PR title \[feat\]  
  - Don’t delete branches when PRs are submitted  
- TA recommends meeting Monday night  
  - Annie to send out when-to-meet  
    - Aim for before 3:30 pm TA/TL meeting  
  - Review just-completed sprint  
  - Full attendance required  
  - Zoom  
- Tuesday in-person meeting after class to prep for next sprint  
- Monday 12 noon build freeze to prepare for check-in during Tuesday class

Plan for this week:

- Login  
  - Invite code  
  - Prof course creation  
- Class list   
  - One card per course per quarter  
- Class directory  
  - Prof can toggle role to any role except prof  
  - TA can toggle role to student or TL  
  - Dropdown frozen for student and TL  
- Skeleton profile page (top part)  
  - Photo, name, email, role, github repo for now

	**ISSUES**

- \#4 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/4](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/4) \- Dingyi   
  - Tentative due date day after tomorrow (11/6)  
  - High priority \- blocks issue \#2  
  - Create data for testing  
    - 1 prof, 10 students, 2 teams, 2 TA, 2 TL  
    - Add to backend  
- \#5 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/5](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/5) \- Shravya  
  - Tentative due date Sunday (11/9)  
  - Url route  
- \#2 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/2](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/2) \- Abhiraj, Sneh, Shretsh  
  - Session timeout 30 minutes (tentative)  
- \#3 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/3](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/3) \- Abhiraj, Sneh, Shretsh  
- \#7 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/7](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/7) \- Zihan  
- \#6 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/6](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/6) \- Annie  
- \#8 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/8](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/8) \- Jeffrey  
- \#9 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/9](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/9) \- Juan  
- PR reviews \- Indresh  
- UX (color, font, etc. standardization)   
- Color-picking \- Lillian  
  - Due day after tomorrow (11/6)  
  - Send decisions out to all  
  - Logo\! (not urgent)  
- Documentation  
  - User flow from login \- Lillian  
  - ADRs \- Annie and Lillian  
    - Decisions

	**DECISIONS**

- Log in page \-\> invite code for a specific class \-\> user enrolled in class  
  - Professor can change roles for users  
    - Editable field for prof, but not for others  
- After logging in, every user can see a dashboard of all their courses  
  - /{course code} when choosing course  
  - Url contains user, class, and role information (foreign key)  
    