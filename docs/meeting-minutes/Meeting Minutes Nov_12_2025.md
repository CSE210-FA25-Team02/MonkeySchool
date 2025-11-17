Meeting Notes 11/12

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

	**NOTES**

- Progress presentation \- keep it higher-level, tailor it for business-minded and technically-minded stakeholders  
  - Will probably be split into two days – better to go on day 1  
- Planning on sticking to the four core features  
- If you come across bugs, create an issue and tag it as a bug  
- Try your best to write docs as you develop  
- Current user profile page is system-wide  
  - Role should be connected to a specific course  
  - An individual can have different roles in different courses  
  - Zihan suggestion:   
    - Maybe just change the role into a badge list:  
      Like:  
      Class \- Role  
      Xxx \- XXX  
- Annie \+ Indresh signed off on this suggestion

	**ISSUES**

- 20 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/20](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/20) \- Juan  
- 27 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/27](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/27) \- Dingyi  
  - Caching frontend data so backend can be called optimally  
  - Trying to meet RAIL  
  - When client makes request to server, the request goes through a service worker  
- 28 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/28](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/28) \- Zihan  
- 29 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/29](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/29) \- Annie  
- 30 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/30](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/30)   
  - Reach out to prof about what he would want for this functionality  
- 31 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/31](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/31)   
  - Clarify with professor/TA  
  - Current understanding is for office hours  
- 32 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/32](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/32) \- Jeffrey  
- 33 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/33](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/33) \- Lillian  
  - Get photo from google account – this info should already be pulled in when user logs in  
  - At this time, to prevent scope creep, we will not be implementing another way to update the profile picture   
- 34 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/34](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/34) \- Shravya  
  - Have an attendance code that expires after a fixed duration  
  - List of history of previous attendance  
  - Editable for prof/TA, view only for students  
- 35 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/35](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/35) \- Lillian  
  - ADRs  
- 36 \- [https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/36](https://github.com/CSE210-FA25-Team02/MonkeySchool/issues/36) \- Abhiraj, Sneh  
  - TAs can create groups  
  - Make it configurable who can create groups  
    - Authorization middleware

    