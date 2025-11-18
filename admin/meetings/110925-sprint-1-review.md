# Sprint 1 Review Meeting Notes
**Date:** November 10, 2025  
**Sprint:** 1  



## Attendees
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
- Establish foundational backend, frontend, and deployment infrastructure  
- Enable class management, user profiles and role-based access control (RBAC) 
- Implement user authentication and authorization  
- Develop reusable core UI framework components  
- Set up continuous deployment (CD) pipeline  
- Familiarize ourselves with standardized commit messages, PR reviews, and branching strategy



## Planned Features
- Create a generic ADR template
- Design wireframe for user profile page  
- Implement OAuth authentication  
- Create user flow diagram for Professor role  
- Select color scheme (Amazonian Forest theme BDD)  
- Add resource–role–quarter based authorization middleware
  - Backend API: Created endpoints for retrieving user's enrolled classes (HTML and JSON formats)
  - Authentication: Implemented optionalAuth middleware with JWT and query parameter fallback for testing 
  - Frontend UI: Designed responsive class card layout with role-based badges following Amazonian Forest theme BDD 
- Add navbar, header, and footer with:
  - UI changes to include fixed header, footer and navigation bar
  - Fixed navigation bar on the left with collapsible sub menu with list of options
  - Header to include profile viewing dropdown option
  - Footer with copyright details
- Create Profile Page Component
  - Displays user info (name, pronouns, bio, contact info)
  - Edit mode allows user to update select fields
  - Modular HTML and CSS components
- Implemented List Classes Page (frontend + backend)
- Add new class creation for professor-only:
    - Allow only Professors to create a new class in DB and generate an invite link for students to join. Will assign professor the PROFESSOR role to class
    - Can assign name and quarter to class. List of quarters will update based on current date
   -  Invite link calls api to add user to the class by assigning STUDENT role
- Display students in class with teams and role management
- Add CD pipeline
- Design and implement basic database entities (database schema creation) with RBAC rules
    - User, group, class, classRole, groupRole, groupSupervisor
    - classRole: PROFESSOR, TA, TUTOR, STUDENT
    - groupRole: LEADER, MEMBER
    - groupSupervisor: relationship between TA and GROUP (TA mentoring GROUPs)
- Create CRUD APIs for operations on main DB entitites
    - user, class (can read both through ID or invite code), classRole
- Display all user-roles
    - create class role services, controller, routes
    - create validation roles checking for class role entries
    - create use case tests on all the class role scenarios
    - user can see all the students, TAs, tutors, and professors for a certain course
    - (currently) All users have access to change the role of the user
        - (future) only professor has access to change role of the user
    - If there is only one professor in the course, the role is not changeable
    - Frontend: UI needs update



## Demos / Accomplishments
![class creation](/admin/meetings/screenshots/sprint-1/class-creation.png)
![multi-class](/admin/meetings/screenshots/sprint-1/multi-class-view.png)
![no-classes-view](/admin/meetings/screenshots/sprint-1/no-classes-view.png)
![my class view](/admin/meetings/screenshots/sprint-1/my-classes.png)
![ui components](/admin/meetings/screenshots/sprint-1/nav-header-side-bar.png)
![profile page](/admin/meetings/screenshots/sprint-1/profile-page.png)


## Unfinished Work
- Authorization middleware implemented, but role-based middleware still pending  
- Integration of backend + frontend components and deployment pipeline  
- Display students in class + team management UI  
- Profile page insert image 


## Feedback / Questions
- Does everyone currently see the same Class Directory view?  
  - Yes (for now)
  - In future, only Professors will see full directory  
- Need finer-grained RBAC
- Potential DB expansion for more fields 
- JS documentation and TypeScript comments missing - need to be added 
- Ensure team alignment on HTMX usage for consistency  
- No documentation updates this sprint
    - updates should be added to `/docs` folder  
- Dark theme CSS needs improvement  
- Introduce PR template for standardization  
- Most work so far focuses on client-side rendering
- Move static values (e.g., URLs) into constants  
    - plan to refactor this week
- Ensure local setup (DB + app) is running for everyone  



## Next Steps
- Add JS Docs and improve CSS consistency  
- Create new tasks next week to align JS Docs and styling  
- Refactor constants and improve RBAC logic  
- Prepare for backlog grooming, Sprint 2 planning and integration testing
