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

    Scenario: Student loads HTMX activity dropdown with two activities
        Given a logged-in student "Bob Student" with email "bob@example.com" exists
        And a class named "CS101" exists and includes that student
        And two activity categories "Studying" and "Lecture" exist
        And two activities for that student exist
        When the student requests their activity dropdown
        Then the response contains HTML option elements for both activities

    Scenario: Student loads dropdown but has no activities
        Given a logged-in student "Bob Student" with email "bob@example.com" exists
        When the student requests their activity dropdown
        Then the response is an empty HTML string

    Scenario: Student loads HTMX activity details for a selected punch
        Given a logged-in student "Bob Student" with email "bob@example.com" exists
        And a class named "CS101" exists and includes that student
        And an activity category "Studying" exists
        And a punch activity for that student exists
        When the student requests the activity details
        Then the response contains the formatted activity details
    
    Scenario: Activity details returns empty message when punch not found
        Given a logged-in student "Bob Student" with email "bob@example.com" exists
        When the student requests details for a non-existent punch
        Then they receive a no-activity-found message

    Scenario: Student loads the Activity Punch Card component
        Given a logged-in student "Bob Student" with email "bob@example.com" exists
        When the student requests the punch card component
        Then the server returns the punch card HTML

    Scenario: User must be authenticated to render punch card
        When an unauthenticated user requests the punch card
        Then they receive an unauthorized response

    Scenario: Open new activity punch form
        Given a logged-in student "John Student" with email "john@university.edu" exists
        When the student attempts to open the new activity punch form
        Then the page should show a form to create a new activity punch

    Scenario: Open edit activity punch form
        Given a logged-in student "John Student" with email "john@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And an activity punch for "Studying" exists and belongs to "John Student"
        When the student attempts to open the edit activity punch form
        Then the page should show a form to edit an activity punch
    
    Scenario: Load create or edit activity fields
        Given a logged-in student "John Student" with email "john@university.edu" exists
        And a class named "Class 1" exists and includes "Bob Student"
        And a student activity category for "Studying" exists
        When the student opens the punch card form
        Then the page should show options for making an activity punch