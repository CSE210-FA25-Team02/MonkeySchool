Feature: Class Role Management

  Scenario: Assign a user to a class with a role
    Given a user "david@example.com" exists
    And a class named "CSE 210" exists
    When I assign "david@example.com" to "CSE 210" as "Student"
    Then "david@example.com" should have role "Student" in "CSE 210"

  Scenario: Change a user's role in a class
    Given "david@example.com" is a "Student" in "CSE 210"
    When I change the role to "Professor"
    Then "david@example.com" should have role "Professor" in "CSE 210"

  Scenario: Remove a user from a class
    Given "david@example.com" is a member of "CSE 210"
    When I remove the user from the class
    Then "david@example.com" should not belong to "CSE 210"
