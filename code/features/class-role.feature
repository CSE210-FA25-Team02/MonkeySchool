Feature: Professor Role Management
  As a professor
  I want to change class member roles
  So that I can properly manage my class structure

  Scenario: Professor successfully promotes a student to TA
    Given I am logged in as "prof.first@ucsd.edu"
    And there is a class "ABC: Advanced Backend Concepts" with invite code "ABC12345"
    And I am a professor in the class
    And there is a second professor "prof.second@ucsd.edu" in the class
    And there is a TA "ta.assistant@ucsd.edu" in the class
    And there are 3 students in the class
    And I am on the class directory page
    When I click the role management button for student "student1@ucsd.edu"
    And I select "TA" from the role dropdown
    Then the student should be moved to the "Teaching Assistants" section
    And the student's role badge should show "TA"
    And the "Students" section count should decrease by 1
    And the "Teaching Assistants" section count should increase by 1

  Scenario: Professor successfully demotes a TA to student
    Given I am logged in as "prof.first@ucsd.edu"
    And there is a class "ABC: Advanced Backend Concepts" with invite code "ABC12345"
    And I am a professor in the class
    And there is a second professor "prof.second@ucsd.edu" in the class
    And there is a TA "ta.assistant@ucsd.edu" in the class
    And there are 3 students in the class
    And I am on the class directory page
    When I click the role management button for TA "ta.assistant@ucsd.edu"
    And I select "Student" from the role dropdown
    Then the TA should be moved to the "Students" section
    And the person's role badge should show "Student"
    And the "Teaching Assistants" section count should decrease by 1
    And the "Students" section count should increase by 1

  Scenario: Professor successfully demotes themselves when multiple professors exist
    Given I am logged in as "prof.first@ucsd.edu"
    And there is a class "ABC: Advanced Backend Concepts" with invite code "ABC12345"
    And I am a professor in the class
    And there is a second professor "prof.second@ucsd.edu" in the class
    And there is a TA "ta.assistant@ucsd.edu" in the class
    And there are 3 students in the class
    And I am on the class directory page
    And there are 2 professors in the class
    When I click the role management button for myself
    And I select "Student" from the role dropdown
    Then I should be moved to the "Students" section
    And my role badge should show "Student"
    And the "Professors" section count should decrease by 1
    And the "Students" section count should increase by 1

  Scenario: Professor cannot demote themselves when they are the only professor
    Given I am logged in as "prof.first@ucsd.edu"
    And there is a class "ABC: Advanced Backend Concepts" with invite code "ABC12345"
    And I am a professor in the class
    And there is a second professor "prof.second@ucsd.edu" in the class
    And there is a TA "ta.assistant@ucsd.edu" in the class
    And there are 3 students in the class
    And I am on the class directory page
    And I first demote the second professor to student
    And I am now the only professor in the class
    When I click the role management button for myself
    Then the "Student", "Tutor", and "TA" options should be disabled
    And the disabled options should show tooltip "Cannot demote yourself - you are the only professor"
    And only the "Professor" option should be enabled

  Scenario: System prevents professor from demoting themselves via API when they are the only professor
    Given I am logged in as "prof.first@ucsd.edu"
    And there is a class "ABC: Advanced Backend Concepts" with invite code "ABC12345"
    And I am a professor in the class
    And there are 3 students in the class
    And I am the only professor in the class
    When I attempt to change my role to "Student" via API
    Then I should receive an error "Cannot demote yourself - you are the only professor in this class. Assign another professor first."
    And my role should remain "Professor"
    And I should stay in the "Professors" section