Feature: List Classes for User

  Scenario: User views their enrolled classes
    Given a user with email "student@ucsd.edu" exists
    And the user is enrolled in class "CSE 210" with role "STUDENT"
    And the user is enrolled in class "CSE 110" with role "TA"
    When the user requests their class list
    Then the response should contain 2 classes
    And the response should include "CSE 210" with role "STUDENT"
    And the response should include "CSE 110" with role "TA"

  Scenario: User with no classes sees empty state
    Given a user with email "newbie@ucsd.edu" exists
    And the user is not enrolled in any classes
    When the user requests their class list
    Then the response should be an empty array

  Scenario: Missing userId parameter returns error
    When I request class list without userId parameter
    Then the response should have status code 401
    And the response should contain error message "Authentication required"

  Scenario: User views class list HTML page
    Given a user with email "htmltest@ucsd.edu" exists
    And the user is enrolled in class "Web Dev 101" with role "STUDENT"
    When the user requests the HTML class list page
    Then the response should contain HTML content
    And the HTML should display "Web Dev 101"

