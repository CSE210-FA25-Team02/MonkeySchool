Feature: Class Management

  Scenario: Create a new class
    When I create a class named "CSE 210"
    Then a class named "CSE 210" should exist
    And the class should have an auto-generated invite code

  Scenario: Update class name
    Given a class named "Old Class" exists
    When I rename the class "Old Class" to "New Class"
    Then a class named "New Class" should exist

  Scenario: Delete a class
    Given a class named "Temp Class" exists
    When I delete the class "Temp Class"
    Then no class named "Temp Class" should exist

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

  Scenario: Get all classes for a user
    Given a user "Bob Student" with email "bob@university.edu" exists
    And a class named "Class 1" exists and includes "Bob Student"
    And a class named "Class 2" exists and includes "Bob Student"
    When I request the classes for "Bob Student"
    Then I should receive the classes "Class 1" and "Class 2"