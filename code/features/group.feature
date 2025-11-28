Feature: Group Management

  Scenario: TA creates a new group
    Given a TA user exists
    And a class "CSE 210" exists
    And the TA is assigned to the class "CSE 210" with role "TA"
    When the TA creates a group named "Team Alpha" in class "CSE 210"
    Then a group named "Team Alpha" should exist
    And the group should belong to class "CSE 210"

  Scenario: TA assigns members to a group
    Given a TA user exists
    And a class "CSE 210" exists
    And the TA is assigned to the class "CSE 210" with role "TA"
    And a group "Team Alpha" exists in class "CSE 210"
    And a student "Alice" exists
    And a student "Bob" exists
    When the TA assigns "Alice" and "Bob" to group "Team Alpha"
    Then group "Team Alpha" should have 2 members

  Scenario: Student views their group
    Given a student "Alice" exists
    And a class "CSE 210" exists
    And the student "Alice" is assigned to class "CSE 210"
    And a group "Team Alpha" exists in class "CSE 210"
    And the student "Alice" is a member of group "Team Alpha"
    When the student "Alice" views their groups
    Then they should see group "Team Alpha"

  Scenario: Team Leader edits group details
    Given a student "Alice" exists
    And a class "CSE 210" exists
    And a group "Team Alpha" exists in class "CSE 210"
    And the student "Alice" is the leader of group "Team Alpha"
    When the student "Alice" updates group "Team Alpha" name to "Team Beta"
    Then group "Team Beta" should exist
    And group "Team Beta" should have the same members as "Team Alpha"

  Scenario: Team Leader cannot change group members
    Given a student "Alice" exists
    And a class "CSE 210" exists
    And a group "Team Alpha" exists in class "CSE 210"
    And the student "Alice" is the leader of group "Team Alpha"
    And a student "Bob" exists
    When the student "Alice" tries to add "Bob" to group "Team Alpha"
    Then the request should be forbidden
    And "Bob" should not be a member of group "Team Alpha"

  Scenario: TA deletes a group
    Given a TA user exists
    And a class "CSE 210" exists
    And the TA is assigned to the class "CSE 210" with role "TA"
    And a group "Team Alpha" exists in class "CSE 210"
    When the TA deletes group "Team Alpha"
    Then no group named "Team Alpha" should exist

  Scenario: Student cannot delete a group
    Given a student "Alice" exists
    And a class "CSE 210" exists
    And a group "Team Alpha" exists in class "CSE 210"
    And the student "Alice" is a member of group "Team Alpha"
    When the student "Alice" tries to delete group "Team Alpha"
    Then the request should be forbidden
    And group "Team Alpha" should still exist

