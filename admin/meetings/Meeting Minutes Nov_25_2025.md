Meeting Notes 11/25

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

- Logging in for users without UCSD email  
  - Will need to integrate the backend auth to the google sign in button  
  - We will have a .csv file where allowed external emails can be entered by an admin  
  - Overwriting our previous tentative design of invite codes for external emails  
- Reviewing Zihan’s UI rework  
  - Dashboard (Main page):  
    - Have Quick Punch open up a textbox modal for a work journal entry  
    - Quick access- join class vs add course depending on role  
    - Can we give the professor/TA a graph of class attendance and/or attendance by team instead of the student component of individual attendance?  
    - Responsive design for mobile view  
    - Remove search feature (any)  
    - Remove Join group button  
  - Dashboard/profile  
    - Profile page backend integration buttons for the edits  
    - Remove Attendance, punches, badges section  
    -   
  - Dashboard/ My Classes  
    - No changes in UI \- Juan will take care of Backend  
  - Dashboard/Individual classes  
    - Edit UI is not there \- Juan  
    - Integrate backend for change role/availability calendar  
  - Dashboard/attendance list  
    - Needs UI, Shravya and Zihan will coordinate with  
  - Dashboard / take attendance  
    - UI for prof and student has to be seperated  
  - 

	**ISSUES**

- PR from Zihan and Dingyi   
  - **\[Blocker\]** 1\. \[Code\] For the renewed frontend code structure so that everyone else can better start to do the backend integrations (The frontend will also provide some corresponding interfaces.)  
  - **\[Blocker\]** 2\. \[Docs\] Give a Brand specs for our new UI (so that we can modify the UI according to this specs)  
    - 3\. Settings in profile page is reserved for showing all accessibility related stuff (pure frontend)  
- Jeffrey will integrate frontend and backend for Create Class button on dashboard  
- Annie will integrate new UI profile page   
- Juan will integrate the class directory  
- Juan will integrate list of courses – can delegate if needed  
- Add some way to access the When-to-Meet functionality – Juan \+ Zihan  
- Shravya will integrate attendance after Zihan creates the page following the new UI  
- Join group button does not have backend yet – remove from page