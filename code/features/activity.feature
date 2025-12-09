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

    Scenario: Quick punch-in creates an activity for a student
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        When the student performs a quick punch for "Lecture"
        Then a new activity punch is created for the student

    Scenario: Quick punch-in fails if no valid class relationship exists
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        When the student performs a quick punch for "Lecture" in unknown class
        Then the student receives an unauthorized activity response
    
    Scenario: Student cannot use a TA-only category
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a TA activity category "Grading" exists
        When the student attempt to create a "Grading" punch
        Then the student receives a forbidden category response

    Scenario: Cannot create an activity when not logged in
        Given a student activity category "Studying" exists
        When an unauthenticated request tries to create a "Studying" punch
        Then the request is rejected as unauthorized

    Scenario: A student cannot update another student's activity punch
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And another student "Alice Student" exists
        And an activity punch for "Studying" exists and belongs to "Alice Student"
        When Bob attempts to update that activity punch
        Then the update is forbidden
    
    Scenario: A student cannot delete another student's activity punch
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And another student "Alice Student" exists
        And an activity punch for "Studying" exists and belongs to "Alice Student"
        When Bob attempts to delete that activity punch
        Then the delete is forbidden




