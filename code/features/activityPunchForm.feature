Feature: Activity Punch Form

    Scenario: Open new activity punch form
        Given a logged-in student "John Student" with email "john@university.edu" exists
        When the student attempts to open the new activity punch form
        Then the page should show a form to create a new activity punch

    Scenario: Close activity punch form
        Given a logged-in student "John Student" with email "john@university.edu" exists
        When the student attempts to close the new activity punch form
        Then the page should disable the activity punch form

    Scenario: Open edit activity punch form
        Given a logged-in student "John Student" with email "john@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And an activity punch for "Studying" exists and belongs to "John Student"
        When the student attempts to open the edit activity punch form
        Then the page should show a form to edit an activity punch

    Scenario: Render punch card
        Given a logged-in student "John Student" with email "john@university.edu" exists
        When the student visits their profile page
        Then the page should show a punch card component
    
    Scenario: Render punch card dropdown
        Given a logged-in student "John Student" with email "john@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And an activity punch for "Studying" exists and belongs to "John Student"
        When the student looks at the punch card on their profile page
        Then the page should show a drop down of their activity punches 

    Scenario: Render activity details
        Given a logged-in student "John Student" with email "john@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And an activity punch for "Studying" exists and belongs to "John Student"
        When the student selects the punch on their punch card
        Then the page should show the details of the "Studying" punch
    
    Scenario: Load create or edit activity fields
        Given a logged-in student "John Student" with email "john@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category for "Studying" exists
        When the student opens the punch card form
        Then the page should show options for making an activity punch