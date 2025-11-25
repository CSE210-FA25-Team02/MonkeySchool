Feature: Activity Punch Card
    
    Scenario: Create a student activity punch
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category "Studying" exists
        When the student attempt to create a "Studying" punch
        Then the student recieves a new activity punch

    Scenario: Create a TA activity punch
        Given a logged-in TA "Sarah TA" with email "sarah@university.edu" exists
        And a class named "Class 1" exists and includes "Sarah TA"
        And a TA activity category "Grading" exists
        When the TA attempt to create a "Grading" punch
        Then the TA recieves a new activity punch

    Scenario: Create an all activity punch as a student
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And an all activity category "Lecture" exists
        When the student attempt to create a "Lecture" punch
        Then the student recieves a new activity punch

    Scenario: Create an all activity punch as a TA
        Given a logged-in TA "Sarah TA" with email "sarah@university.edu" exists
        And a class named "Class 1" exists and includes "Sarah TA"
        And an all activity category "Lecture" exists
        When the TA attempt to create a "Lecture" punch
        Then the TA recieves a new activity punch

    Scenario: Get an activity punch by ID
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category "Studying" exists
        And an activity punch for "Studying" exists and belongs to "Bob Student"
        When the student attempts to get an activity punch with ID
        Then the student recieives the "Studying" activity punch 

    Scenario: Get all activities from a student
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category "Studying" exists
        And a student activity category "Lecture" exists
        And an activity punch for "Studying" exists and belongs to "Bob Student"
        And an activity punch for "Lecture" exists and belongs to "Bob Student"
        When the student attempts to get all of their activities 
        Then the student recieives the "Studying" and "Lecture" activity punch 

    Scenario: Update an activity punch
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category "Studying" exists
        And a student activity category "Lecture" exists
        And an activity punch for "Studying" exists and belongs to "Bob Student"
        When the student tries to update the category to "Lecture"
        Then the student recieves a "Lecture" activity punch
    
    Scenario: Delete an activity punch
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category "Studying" exists
        And an activity punch for "Studying" exists and belongs to "Bob Student"
        When the student deletes the activity punch
        Then the student receivies no activity punch

