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
