# Sprint 2 Review Meeting Notes

**Date:** November 18, 2025

**Sprint:**  2

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
- Integrate JSDocs into CI pipeline (Linter will fail if JSDoc comments are not included)
- Punch Card feature:
    - Created schema for activities and activity categories (role specific)
    - Can create new, edit, and view past punch activities on Profile page
    - Can specify class, category, punch in time, and punch out time


- Attendance feature:
    - Capability for professor to: 
        - start a session
        - Start an attendance poll
        - View attendance records for a session
        - View attendance records for a course
    - Capability for students to:
        - Mark their attendance
        - View their attendance for various sessions per course
- Add google profile photo to the profile page component; fallback to initials if there is a broken photoURL
- Create ADRs for stack and database configuration
- Group Feature:
	- Group management system for TA, Students and Team Leads for collaboration
- Implement role based Group Management where TAs can create and manage groups, students can view group details, and Team Leaders can edit group information like name, description, or notes.
- Ensure proper access control to prevent unauthorized edits and display group data in profiles or a dedicated Groups page.



- Feature/create-class-directory-component:
	- Add a new service for the class model
	- Add HTML render helper functions to the controller to display the new UI and queried data
	- Add endpoints for the new server
	- Add the create-class-directory-component feature with all the edge cases for testing.
	- Add step.js testing file that could run and test all the features


- Explore cache strategy
- Explore and implement a Service Worker–based caching strategy
- Add offline-friendly behavior to HTMX pages (API caching, static asset caching, SPA shell caching)
	- Generate precache-manifest.json (static file list) automatically to support deterministic build-time caching






## Planned Features
<!-- List all major features or tasks planned for this sprint. Include both technical and UI goals. → -->
- Punch card tracker
- JSDocs integration with CI
- CSS cleanup
- Class directory component
- Cache service-worker



## Demos / Accomplishments
<!-- Include links, screenshots, or summaries of what was demoed at the sprint review. -->

![Activity Punch](/admin/meetings/screenshots/sprint-2/activity-punch-1.png)
![Activity Punch 2](/admin/meetings/screenshots/sprint-2/activity-punch-2.png)
![Class Card](/admin/meetings/screenshots/sprint-2/class-card.png)
![Class Directory 1](/admin/meetings/screenshots/sprint-2/class-dir1.png)
![Class Directory 2](/admin/meetings/screenshots/sprint-2/class-dir2.png)
![Class Directory 3](/admin/meetings/screenshots/sprint-2/class-dir3.png)
![Class Directory 4](/admin/meetings/screenshots/sprint-2/class-dir4.png)
![Profile Pic](/admin/meetings/screenshots/sprint-2/profile-image.png)







## Unfinished Work
<!-- List items that were unfinished during sprint
Can also mention why was not completed -->
- UI needs to be consistent (CSS styling)
- Continue on class directory component (make a PR during upcoming sprint)
- Testing
- Punch card UI to improve

Want to extend this sprint to Wednesday 
## Feedback / Questions
<!-- Capture discussion points, technical blockers, or improvements mentioned during the review. → --> 
- There are currently two buttons to get to view profile; don’t think we need both
- The JSDocs does not get deployed 
- Abhiraj/Sneh:
	- there is an issue with UI population when user tries to log in as professor, they are getting a no access allowed page
- Should the users be linked to their profile page? 








## Next Steps
<!-- Clear action items for next sprint → --> 
- Dingyi, Zihan, Abhiraj, Sneh will work on making the UI more modern and clean
	- Abhiraj and Sneh will join after they finish fixing the group functionality
- notes from TA touchbase:
	- double-check any AI generated code to make sure it is still good code
	- we have been focusing on smaller details like RAIL and middleware, we should focus on broader things going forward to pick up the progress
- Abhiraj to join as PR reviewer
- When you submit a PR, send a message in Slack, so that reviewers can address them promptly

