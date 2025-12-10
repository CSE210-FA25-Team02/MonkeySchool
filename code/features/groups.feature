Feature: Group Management
  As a professor or TA
  I want to manage groups within my class
  So that I can organize students into teams

  Scenario: Professor successfully creates a group
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    When I create a group with name "Team Alpha" for the class
    Then the group should be created successfully
    And the group should have name "Team Alpha"
    And the group should belong to the class

  Scenario: Professor creates a group with all optional fields
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    When I create a group with:
      | name   | Team Alpha                       |
      | logoUrl| https://example.com/logo.png     |
      | mantra | We conquer challenges together   |
      | github | https://github.com/team-alpha    |
    Then the group should be created with all the provided details

  Scenario: TA successfully creates a group
    Given I am logged in as "ta@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a TA in the class
    And there are 3 students in the class
    When I create a group with name "Team Beta" for the class
    Then the group should be created successfully
    And the group should have name "Team Beta"

  Scenario: Student cannot create a group
    Given I am logged in as "student1@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a student in the class
    When I attempt to create a group with name "Team Gamma" for the class
    Then I should receive a 403 Forbidden error
    And the group should not be created

  Scenario: Professor adds a student to a group as a member
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a group "Team Alpha" in the class
    When I add student "student1@ucsd.edu" to the group as "MEMBER"
    Then the student should be added to the group
    And the student's role in the group should be "MEMBER"

  Scenario: Professor adds a student to a group as a leader
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a group "Team Alpha" in the class
    When I add student "student1@ucsd.edu" to the group as "LEADER"
    Then the student should be added to the group
    And the student's role in the group should be "LEADER"

  Scenario: TA adds multiple students to a group
    Given I am logged in as "ta@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a TA in the class
    And there are 5 students in the class
    And there is a group "Team Alpha" in the class
    When I add 3 students to the group with different roles
    Then the group should have 3 members
    And the students should have their assigned roles

  Scenario: Professor promotes a member to leader
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a group "Team Alpha" in the class
    And student "student1@ucsd.edu" is a member of the group
    When I update student "student1@ucsd.edu" role to "LEADER" in the group
    Then the student's role should be updated to "LEADER"

  Scenario: Professor demotes a leader to member
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a group "Team Alpha" in the class
    And student "student1@ucsd.edu" is a leader of the group
    When I update student "student1@ucsd.edu" role to "MEMBER" in the group
    Then the student's role should be updated to "MEMBER"

  Scenario: Group leader can add members to their own group
    Given I am logged in as "student1@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And there are 5 students in the class
    And I am a student in the class
    And there is a group "Team Alpha" in the class
    And I am a leader of the group
    When I add student "student2@ucsd.edu" to the group as "MEMBER"
    Then the student should be added to the group

  Scenario: Regular member cannot add other members
    Given I am logged in as "student1@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And there are 3 students in the class
    And I am a student in the class
    And there is a group "Team Alpha" in the class
    And I am a member (not leader) of the group
    When I attempt to add student "student2@ucsd.edu" to the group
    Then I should receive a 403 Forbidden error
    And the student should not be added to the group

  Scenario: Professor removes a member from a group
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a group "Team Alpha" in the class
    And student "student1@ucsd.edu" is a member of the group
    When I remove student "student1@ucsd.edu" from the group
    Then the student should be removed from the group
    And the group should have 0 members

  Scenario: Professor assigns a TA as supervisor
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there is a TA "ta@ucsd.edu" in the class
    And there is a group "Team Alpha" in the class
    When I add TA "ta@ucsd.edu" as a supervisor to the group
    Then the TA should be assigned as supervisor
    And the group should have 1 supervisor

  Scenario: TA cannot add supervisors (professor-only operation)
    Given I am logged in as "ta@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a TA in the class
    And there is another TA "ta2@ucsd.edu" in the class
    And there is a group "Team Alpha" in the class
    When I attempt to add TA "ta2@ucsd.edu" as a supervisor to the group
    Then I should receive a 403 Forbidden error
    And the TA should not be added as supervisor

  Scenario: Professor removes a TA supervisor
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there is a TA "ta@ucsd.edu" in the class
    And there is a group "Team Alpha" in the class
    And TA "ta@ucsd.edu" is a supervisor of the group
    When I remove TA "ta@ucsd.edu" as supervisor from the group
    Then the TA should be removed as supervisor
    And the group should have 0 supervisors

  Scenario: Professor updates group details
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there is a group "Team Alpha" in the class
    When I update the group with:
      | name   | Team Alpha Updated           |
      | mantra | Innovation through teamwork  |
    Then the group name should be "Team Alpha Updated"
    And the group mantra should be "Innovation through teamwork"

  Scenario: TA can update group details
    Given I am logged in as "ta@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a TA in the class
    And there is a group "Team Beta" in the class
    When I update the group name to "Team Beta Revised"
    Then the group name should be "Team Beta Revised"

  Scenario: Group leader can update their group details
    Given I am logged in as "student1@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a student in the class
    And there is a group "Team Alpha" in the class
    And I am a leader of the group
    When I update the group mantra to "Together we achieve more"
    Then the group mantra should be "Together we achieve more"

  Scenario: Regular member cannot update group details
    Given I am logged in as "student1@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a student in the class
    And there is a group "Team Alpha" in the class
    And I am a member (not leader) of the group
    When I attempt to update the group name to "Hacked Team"
    Then I should receive a 403 Forbidden error
    And the group name should remain "Team Alpha"

  Scenario: Professor deletes a group
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there is a group "Team Alpha" in the class
    When I delete the group
    Then the group should be deleted
    And the group should not exist in the database

  Scenario: TA can delete a group
    Given I am logged in as "ta@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a TA in the class
    And there is a group "Team Beta" in the class
    When I delete the group
    Then the group should be deleted

  Scenario: Student cannot delete a group
    Given I am logged in as "student1@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a student in the class
    And there is a group "Team Alpha" in the class
    And I am a leader of the group
    When I attempt to delete the group
    Then I should receive a 403 Forbidden error
    And the group should still exist

  Scenario: Get all groups in a class
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 groups in the class
    When I get all groups for the class
    Then I should receive 3 groups
    And all groups should belong to the class

  Scenario: Get group details with members and supervisors
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a TA "ta@ucsd.edu" in the class
    And there is a group "Team Alpha" in the class
    And student "student1@ucsd.edu" is a leader of the group
    And student "student2@ucsd.edu" is a member of the group
    And TA "ta@ucsd.edu" is a supervisor of the group
    When I get details for the group
    Then the group should have 2 members
    And the group should have 1 supervisor
    And student "student1@ucsd.edu" should be a leader
    And student "student2@ucsd.edu" should be a member

  Scenario: Cannot add the same student to a group twice
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there are 3 students in the class
    And there is a group "Team Alpha" in the class
    And student "student1@ucsd.edu" is a member of the group
    When I attempt to add student "student1@ucsd.edu" to the group again
    Then I should receive a 400 Bad Request error
    And the error message should mention "already a member"

  Scenario: Cannot add a user who is not in the class to a group
    Given I am logged in as "prof@ucsd.edu"
    And there is a class "CSE 210: Software Engineering" with invite code "CSE210"
    And I am a professor in the class
    And there is a user "outsider@ucsd.edu" who is not in the class
    And there is a group "Team Alpha" in the class
    When I attempt to add user "outsider@ucsd.edu" to the group
    Then I should receive a 400 Bad Request error
    And the error message should mention "not enrolled in the class"
