Feature: User Management

  Scenario: Create a new user
    Given no user exists with email "alice@example.com"
    When I create a user with name "Alice" and email "alice@example.com"
    Then a user with email "alice@example.com" should exist
    And the user name should be "Alice"

  Scenario: Update a user's name
    Given a user with name "Bob" and email "bob@example.com" exists
    When I update the user "bob@example.com" name to "Bobby"
    Then the user name should be "Bobby"

  Scenario: Delete a user
    Given a user with email "charlie@example.com" exists
    When I delete the user with email "charlie@example.com"
    Then no user with email "charlie@example.com" should exist
