Feature: Class Role Management

  Scenario: Get class roster as a professor
    Given a class named "CS101" exists
    And the following users are in the class:
      | name      | email           | role      |
      | Prof Smith| prof@test.com   | PROFESSOR |
      | John Doe  | john@test.com   | STUDENT   |
      | Jane Smith| jane@test.com   | TA        |
    When I request the class roster
    Then the response should be successful
    And the roster should contain all class members

  Scenario: Professor assigns a role to a user
    Given a professor "prof@test.com" exists in class "CS101"
    And a user "student@test.com" exists
    When the professor assigns "STUDENT" role to the user
    Then the assignment should be successful
    And the user should have "STUDENT" role in the class

  Scenario: Professor changes a user's role
    Given a user "user@test.com" with role "STUDENT" exists in class "CS101"
    When the professor changes the user's role to "TA"
    Then the role change should be successful
    And the user should now have "TA" role

  Scenario: Non-professor cannot assign roles
    Given a student "student@test.com" exists in class "CS101"
    And another user "target@test.com" exists
    When the student tries to assign "TA" role to the other user
    Then the request should be forbidden

  Scenario: Professor removes a user from class
    Given a professor "prof@test.com" and student "student@test.com" exist in class "CS101"
    When the professor removes the student from the class
    Then the removal should be successful
    And the student should no longer be in the class

  Scenario: Cannot remove the last professor
    Given only one professor "prof@test.com" exists in class "CS101"
    When someone tries to remove the professor
    Then the request should be rejected

  Scenario: Get roster for non-existent class
    Given a non-existent class ID
    When I request the roster for the non-existent class
    Then the response should be not found

  Scenario: Handle non-existent user assignment
    Given a professor "prof@test.com" exists in class "CS101"
    When the professor tries to assign a role to a non-existent user
    Then the request should be not found

  Scenario: Cannot assign invalid role
    Given a professor "prof@test.com" exists in class "CS101"
    And a user "user@test.com" exists
    When the professor tries to assign "INVALID_ROLE" role to the user
    Then the request should be rejected
