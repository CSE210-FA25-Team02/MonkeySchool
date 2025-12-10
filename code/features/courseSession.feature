Feature: Course Sessions

    Scenario: Create a new course session as Professor
        Given a class named "CSE210" for "FA25" exists
        And the class is taught by a professor
        When the professor starts a course session
        Then a course session has been made
    
    Scenario: Non-authenticated user cannot create a course session
        Given a class named "CSE 210" for "FA25" exists
        When a user tries to start a course session without authentication
        Then the request should be rejected and redirect

    Scenario: Non-professor user cannot create a course session
        Given a class named "CSE 210" for "FA25" exists
        And the class has a student user
        When the student tries to start a course session
        Then the request should be rejected with status 403

    Scenario: Create session via HTMX request
        Given a class named "CSE 210" for "FA25" exists
        And the class is taught by a professor
        When the professor sends a course session request with HX header
        Then the response status should be 200 and HX-Redirect should be set
    
    Scenario: Retrieve an existing course session
        Given a class named "CSE 210" for "FA25" exists
        And the class is taught by a professor
        And a course session exists for that class
        When the professor requests the course session by ID
        Then the session data should be returned with status 200
    
    Scenario: Retrieve a non-existent course session
        Given a class named "CSE 210" for "FA25" exists
        And the class is taught by a professor
        When a user requests a course session with a random ID
        Then the request should be rejected with status 404

    Scenario: Retrieve all sessions for a class
        Given a class named "CSE210" for "FA25" exists
        And the class is taught by a professor
        And multiple course sessions exist for that class
        When the professor requests all sessions for the class
        Then all sessions for the class should be returned with status 200
    
    Scenario: Retrieve today's sessions for a class
        Given a class named "CSE210" for "FA25" exists
        And the class is taught by a professor
        And a course session exists for today
        When the professor requests today's sessions for the class
        Then the response should include today's session

    Scenario: Update an existing course session
        Given a class named "CSE210" for "FA25" exists
        And the class is taught by a professor
        And a course session exists for that class
        When the professor updates the session name to "CSE202"
        Then the session should have the updated name "CSE202"

    Scenario: Delete an existing course session
        Given a class named "CSE210" for "FA25" exists
        And the class is taught by a professor
        And a course session exists for that class
        When the professor deletes the course session
        Then the session should be deleted successfully