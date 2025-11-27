Feature: Create class form

    Scenario: Professor opens the create class form
        Given a logged-in professor user exists
        When the professor opens the create class form modal
        Then the page should show a form to create a class

    Scenario: Professor closes the class creation form
        Given a logged-in professor user exists
        And the professor opens the create class form modal
        When the professor requests to close the class creation form
        Then an empty form container should be returned
    
    Scenario: A student cannot open the create class form
        Given a logged-in student user exists
        When the student attempts to open the create class form modal
        Then the system should deny access

    Scenario: Unauthenticated user cannot open the create class form
        Given no user is logged in
        When the user tries to open the create class form modal
        Then they should be redirected to login

    