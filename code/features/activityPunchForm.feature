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