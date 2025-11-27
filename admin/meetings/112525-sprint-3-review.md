## Sprint Review Meeting Notes


**Date:** November 25, 2025

**Sprint:** 3




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
<!-- Summarize what this sprint aimed to achieve → -->
- Review existing PRs and merge
- Stakeholder feedback for more clarity on availability and work journal features
- Add unit tests for Class, Class Creation, and Activity Ph features
  - Tested for API calls,service/controller functions, and HTMX swaps
  - Increased test coverage by 11%
- Calendar for Class Schedule:
  - Professor, TA, Tutors, Students, Group leaders: Should be able to view calendar for the course
  - Calendar has week and day view
  - Events in the calendar can be group meetings lectures, office hours
  - Professor, TA, Tutors can create lectures, OH events 
  - Professor, TA, Tutors, Group leaders can create Group meetings
  - Students can view lectures, OH and meetings of their group


- User availability calendar design in a new page with User calendar and group calendar
- Event Model design
- Availability model build
  - Professor, TA, Tutor, Group Leed have access to create events
  - Everyone in the group has access to the group calendar
- UI clean up & Redesign: 
  - Redesigned the frontend
  - Demo the new UI style & func reqs
  - UI prototype that is mostly compatible with our current backend
	






## Planned Features
<!-- List all major features or tasks planned for this sprint. Include both technical and UI goals. → --> 


- UI re-implementation
  - After UI design is finalized
  - Firstly, implement some general features without backend need
  - Then front-back end integration (maybe with some more teammates)
  - Accessibility improvement
- Test coverage for HTMX templates and other API calls
  - Test profile page HTMX (may need refactoring)
  - Test error handling and unauthorized calls
  - Test branches
  - Cover any helper or API calls not covered 

- Calendar implementation for user availability 
	- What kind of functionality is needed 
	- Test calendar functionality


## Demos / Accomplishments
<!-- Include links, screenshots, or summaries of what was demoed at the sprint review. → -->
![availability](/admin/meetings/screenshots/sprint-3/availability.png)
![Calendar](/admin/meetings/screenshots/sprint-3/calendar.png)
![Journal](/admin/meetings/screenshots/sprint-3/journal.png)
![schedule](/admin/meetings/screenshots/sprint-3/schedule.png)
![UI 1](/admin/meetings/screenshots/sprint-3/ui-demo-1.png)
![UI 2](/admin/meetings/screenshots/sprint-3/ui-demo-2.png)
![UI 3](/admin/meetings/screenshots/sprint-3/ui-demo-3.png)

## Unfinished Work
<!-- List items that were unfinished during sprint
Can also mention why was not completed → --> 
- The event calendar feature has bugs related to creating group events
- Integrating backend
- UI cleanup with calendar


## Feedback / Questions
<!-- Capture discussion points, technical blockers, or improvements mentioned during the review. -->
- Accessibility improvement plan
  - Will apply after most of UIs are done
- Availability calendar corners to be rounded

## Next Steps
<!-- Clear action items for next sprint -->
- Create the journal
- Enjoy the break
- Will meet up on Monday
- UI: go through UI check what is doen and not done, want to delegate work 

