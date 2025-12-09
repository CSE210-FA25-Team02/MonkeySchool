# Sprint Review Meeting Notes

**Date:** December 7, 2025

**Sprint:**  4


## Attendees
 <!-- List all team members who attended -->
- Annie Phan  
- Abhiraj Srivastava  
- Dingyi Yu  
- Indresh Pradeepkumar  
- Jeffrey Hata  
- Juan Yin  
- Lillian Liu  
- Shravya Ramasahayam  
- Shresth Grover  
- Sneh Davaria  
- Zihan Zhou  



## Sprint Goals
<!-- Summarize what this sprint aimed to achieve -->
- Create Group Tasks
  - Backend done and tested.
  - Waiting on a few other tasks to be merged and integrated to test out the frontend side of things
  - Logic checked and verified
- Events Calendar:
  - Possible event types: Lecture Hours, Office Hours, Group meeting, etc
  - A calendar view of events for each course
    - Prof/TA/Tutor can view all the events on the calendar,including group events of all the groups.
    - Students can view events of the course (lectures, discussion hours and office hours) of the course and group events of their group
  - Option to create new events or update existing events with responsibilities as follows:
    - PROFESSOR and TA: Can create all 5 event types: COURSE_LECTURE, COURSE_OFFICE_HOUR, COURSE_DISCUSSION, GROUP_MEETING, OTHER
    - TUTOR: Can create 4 event types (cannot create lectures): COURSE_OFFICE_HOUR, COURSE_DISCUSSION, GROUP_MEETING, OTHER
    - STUDENT (Group Leader): If a student is a group leader, they can create GROUP_MEETING
    - STUDENT (Regular): Cannot create any event types
- Pulse Check Feature:
  - In the course page, provide a pulse check bar for students. Here, students can see emojis on a scale of 1 to 5
  - Students, after polling, will see the pulse they checked in for the day
  - The professor/TA/tutor is able to view the pulse stats on the course page
  - Analytics for the course can be viewed at an aggregate of the last 1 day, 7 days and 30 days as a line graph
  - On clicking on any date, Prof/TA/tutor is able to view the students' list and the pulse they checked in for the day
- 1. Availability calendar for individuals and groups. 2. Create a role management button for the professor, so the professor has access to change the role of all the users in the current class.
  - Roles applied:
    - A professor can change the role of any user in the class
    - If there is only one professor, the professoror can not change their role to the other roles
    - If there is more than one professor, they change themselves to other roles
- Class creation integration
  - Professor can create classes from both the My Classes page and Dashboard
  - Professor can assign class with name, quarter, and location
  - Quarter list updates based on current date
  - Student count and location appear properly in class header and on class cards
  - Students can join the class via the invite link copied by the professor
  - Bug fixes for copy and cancel button sending creation form, opening modal after creating class returns invite link instead of new form, and duplicated footer on invite modal
- Profile page integrated backend and frontend integration
  - Bug fixed on where profile page layout changed after edit
- Role-based rendering
  - Prof has permission to create classes, whereas others have permission only to join classes
  - TA/Prof can conduct an attendance poll, whereas students can fill in the attendance
- Journaling and activity history in the profile page
- Class settings page to add external emails


## Demos / Accomplishments
<!-- Include links, screenshots, or summaries of what was demoed at the sprint review. -->

- Class settings page

  - ![Class Settings](/admin/meetings/screenshots/sprint-4/class-settings.png)

- Role Management Button
  - ![Role Management](/admin/meetings/screenshots/sprint-4/role-management.png)

- Availability Calendar
  - Personal Calendar
    - ![Personal Calendar](/admin/meetings/screenshots/sprint-4/availability1.png)
  - Group Calendar
    - ![Group Calendar](/admin/meetings/screenshots/sprint-4/availability2.png)

- Attendance PROF/TA UI
  - ![Attendance](/admin/meetings/screenshots/sprint-4/attendance.png)

- Pulse Check:
  - Pulse check student
    - ![Pulse check student](/admin/meetings/screenshots/sprint-4/pulse-check1.png)

  - Pulse check professor
    - ![Pulse check professor](/admin/meetings/screenshots/sprint-4/pulse-check2.png)
    - ![Pulse check professor2](/admin/meetings/screenshots/sprint-4/pulse-check3.png)

- Calendar View:
  - ![Calendar view](/admin/meetings/screenshots/sprint-4/calendar-view.png)

- Calendar Day View:
  - ![Calendar day view](/admin/meetings/screenshots/sprint-4/day-view.png)

- Event Creation:
  - ![Event Creation](/admin/meetings/screenshots/sprint-4/event-creation.png)

- Event Update:
  - ![Event Update](/admin/meetings/screenshots/sprint-4/event-update.png)

- Class Creation:
  - ![Class Creation 1](/admin/meetings/screenshots/sprint-4/class-creation1.png)
  - ![Class Creation 2](/admin/meetings/screenshots/sprint-4/class-creation2.png)
  - ![Class Creation 3](/admin/meetings/screenshots/sprint-4/class-creation3.png)
## Unfinished Work
<!-- List items that were unfinished during sprint
Can also mention why was not completed -->
- The event calendar feature has bugs related to creating group events
- Integrating backend
- Create Group Tasks
  - Waiting on a few other tasks to be merged and integrated to test out the frontend side of things


## Next Steps
<!-- Clear action items for next sprint -->
- UI: go through UI check what is done and not done, want to delegate work 

- Final Integration clean and fix any bugs
- Make demos
- Create Group Tasks - Fix and merge the pr after testing locally, coding part is done, tests to be added
