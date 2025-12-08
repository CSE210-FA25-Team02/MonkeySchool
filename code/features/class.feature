Feature: Class Management

  Scenario: Create a new class as Professor
    When I create a class named "CSE 210" for "FA25"
    Then a class named "CSE 210" for "FA25" should exist
    And the class should have an auto-generated invite code

  Scenario: Update class name as Professor
    Given a class named "Old Class" for "FA25" exists
    When I rename the class "Old Class" to "New Class" for "FA25"
    Then a class named "New Class" should exist

  Scenario: Update class name as TA
    Given a class named "Old Class" for "FA25" exists
    When I rename the class "Old Class" to "New Class" for "FA25"
    Then a class named "New Class" should exist
  
  Scenario: Fail to update class name as Student
    Given a class named "Old Class" for "FA25" exists
    When I rename the class "Old Class" to "New Class" for "FA25"
    Then the request should be forbidden

  Scenario: Delete a class as Professor
    Given a class named "Temp Class" exists for "FA25"
    When I delete the class "Temp Class" for "FA25"
    Then no class named "Temp Class" should exist for "FA25"

  Scenario: Fail to delete a class as TA
    Given a class named "Temp Class" exists for "FA25"
    When I delete the class "Temp Class" for "FA25"
    Then the request should be forbidden
  
  Scenario: Fail to delete a class as Student
    Given a class named "Temp Class" exists for "FA25"
    When I delete the class "Temp Class" for "FA25"
    Then the request should be forbidden

  Scenario: Get an existing class
    Given a class named "Curr Class" exists
    When I request the class ID for "Curr Class"
    Then I should recieve a class called "Curr Class"

  Scenario: Get a non-existent class
    Given no class named "No Class" exists
    When I request a class with ID 9999
    Then I should not get a 404 Not Found response

  Scenario: Join a class by invite
    Given a class named "Join Class" exists
    When I request to join a class with its invite code
    Then I should be added to the class called "Join Class"

  Scenario: Fail to join a class by invite
    Given a class named "Join Class" exists
    When I request to join a class with an invalid invite code
    Then I should recieve an invalid invite

  Scenario: Find a class by invite code
    Given a class named "Join Class" exists
    When I request to find a class by its invite code
    Then I should get the class called "Join Class"

  Scenario: Get all classes for a user
    Given a user "Bob Student" with email "bob@university.edu" exists
    And a class named "Class 1" exists and includes "Bob Student"
    And a class named "Class 2" exists and includes "Bob Student"
    When I request the classes for "Bob Student"
    Then I should receive the classes "Class 1" and "Class 2"
  
  Scenario: Get class directory JSON
    Given a class named "Class 1" exists with members and groups
    When I request the directory for the class
    Then I should receive the organized class directory

  Scenario: View classes as a full page
    Given I am a user with classes exists
    When I request my classes as a normal page
    Then I should receive the full page HTML

  Scenario: View classes as a partial HTMX
    Given a user with classes exists
    When I request my classes via HTMX
    Then I should receive the class list HTML

  Scenario: Render class page for a student
    Given a user with email "student@ucsd.edu" and name "Student User" exists
    And a class named "Algorithms 101" exists
    And the user is enrolled in "Algorithms 101" as "STUDENT"
    When I request the class page for "Algorithms 101"
    Then I should receive the full page HTML
    And the HTML should contain "Algorithms 101"
    And the HTML should contain the pulse component
    And the HTML should contain the "Punch In" button

  Scenario: Render class page for an instructor
    Given a user with email "professor@ucsd.edu" and name "Professor User" exists
    And a class named "Algorithms 101" exists
    And the user is enrolled in "Algorithms 101" as "PROFESSOR"
    When I request the class page for "Algorithms 101"
    Then I should receive the full page HTML
    And the HTML should contain "Algorithms 101"
    And the HTML should NOT contain the pulse component
    