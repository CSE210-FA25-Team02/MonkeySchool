210 11/19 OH

* What is included in general vs. specific availability for the class directory feature?  
  * professor OH  
  * TA OH and their meeting availability for TL:TA meetings – something to let TL’s (and maybe students?) request a meeting time  
* Is student availability necessary or is team availability sufficient?   
  * team availability is the most important  
* Team availability  
  * need to be able to see if a worrisome student is has low or poorly overlapping availability  
  * rating of degree of availability per group (possible feature)  
  * should be able to be seen by the ta, tutor, prof, TL, and team members  
    * view-only should be sufficient for ta, tutor, prof


* **Work journal:**  
  * We have a class selection workflow – journal per class vs journal per student?  
    * Did not get to this question  
  * join with pulse functionality? "Express emotional sentiment about themselves, the team, the course"  
    * From discussion at team meeting: issues with privacy bc journal itself should be private but pulse is something that we want to monitor  
      * From prof:  
      * private and public journal versions  
        * encrypted at rest with a value based on their user ID  
        * private can be used for documenting less-than-helpful teammates  
    * [runsteady.com](http://runsteady.com) as an example of what prof is looking for in terms of functionality  
    * not just self-entry:  
      * status as what issues you closed \-- tie with GitHub  
        * i.e. generate journal entry when you close an issue  
      * auto-populate entries with meeting attendance or with number of slack messages  
      * trying to capture participation


* Prof mentioned undergrad teams manipulating code coverage by getting a 100% button from somewhere else and pasting it into their repo (lol)  
  * we need remember to write more tests and keep our coverage up


* Thoughts on combining prof user interaction recording with the work journal functionality?  
  * i think this should be ok tbh, but then is there a way to generate some sort of graph of an individual's interactions  
  * or we could try to add it to the class directory as a like thumbs up / thumbs down button that will auto-create a journal entry with the student's name and the date and the positive interaction  
    * maybe have a textbox popup so that prof can add notes about the interaction  
  * ^talked to professor about these two paths and he said either way was fine


* We should get a team based overview with % and an overall class overview and plot it over time (from the Attendance System feature)  
  * What role is this for? or is this for everyone?  
    * Sounds like anyone should be able to see this considering that Powell told me that one of the goals of the app is to encourage improvement via comparison  
    * Show student attendance averages and compare to overall team to let them know if they are below average and need to pick up the effort  
      * I think this should be on the landing page

* Student landing page thoughts:  
  * Have the attendance graphs  
  * Have the personal attendance percentage (green, yellow, red statuses?)  
  * Have the textbox for a quick journal entry  
  * Have a field to record attendance  
* Professor landing page thoughts:  
  * Have the attendance graphs  
  * Have a graph of the pulses for team-level (?)  
  * Have the class directory at the bottom where they can search for a student card or the work journal textbox


* Goals of app: trying to use comparison to try to encourage people to do better, trying to track actual contributions to track students comprehension and contribution  
* **Prof is looking for EASE OF USE**  
* Main problem of the course is people not attending / not contributing   
* Think about adaptive design for mobile vs desktop  
  * Change where buttons are or how big they are  
  * Css @media       
  * Or think about fluid design (formulas to determine scaling)  
    * Utopia.fyi

* Attendance and availability scores (as compared to some average?)  
* General and temporary availability – be able to tweak and update for like an outage  
    
  Answers to Team 4 questions:  
* digitalocean, firebase, netlify, hiroku  
  * one-click deployment from GitHub actions  
* AWS is poor choice bc it is assuming that the prof has a lot of time and resources to deal with AWS  
* webpage as DOM tree \-- get too deep into tree will lead to performance issues