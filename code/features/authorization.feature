Feature: Class Authorization

  Scenario: A user with the correct role and quarter can access the resource
    Given a user with the role "PROFESSOR" for the class "CSE 110" in the "FA25" quarter
    When the user tries to access the class "CSE 110" in the "FA25" quarter
    Then the user should be able to access the resource

  Scenario: A user with the wrong role cannot access the resource
    Given a user with the role "STUDENT" for the class "CSE 110" in the "FA25" quarter
    When the user tries to update the class "CSE 110" in the "FA25" quarter
    Then the user should not be able to access the resource

  Scenario: A user with the correct role but the wrong quarter cannot access the resource
    Given a user with the role "PROFESSOR" for the class "CSE 110" in the "FA25" quarter
    When the user tries to access the class "CSE 110" in the "WI26" quarter
    Then the user should not be able to access the resource

  Scenario: A user who is not logged in cannot access the resource
    Given a user is not logged in
    When the user tries to access the class "CSE 110" in the "FA25" quarter
    Then the user should not be able to access the resource

  Scenario: A user who is not enrolled in the class cannot access the resource
    Given a user is logged in
    And a class "CSE 110" exists in the "FA25" quarter
    When the user tries to access the class "CSE 110" in the "FA25" quarter
    Then the user should not be able to access the resource

  Scenario: A user with a role in a different quarter for the same class cannot update the resource
    Given a user with the role "STUDENT" for the class "CSE 110" in the "FA25" quarter
    And the user has the role "PROFESSOR" for the class "CSE 110" in the "WI26" quarter
    When the user tries to update the class "CSE 110" in the "FA25" quarter
    Then the user should not be able to access the resource