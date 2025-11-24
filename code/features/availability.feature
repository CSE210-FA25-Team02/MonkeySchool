Feature: Availability Management

  Scenario: User adds valid availability
    Given a user with email "alice@example.com" exists
    When Alice adds availability for Monday from "09:00" to "11:00"
    Then the availability should be created successfully
    And Alice should have availability on Monday from "09:00" to "11:00"

  Scenario: User adds invalid availability with bad time format
    Given a user with email "alice@example.com" exists
    When Alice tries to add availability for Monday from "9:00" to "11:00"
    Then the request should fail with error "Invalid startTime: 9:00"

  Scenario: User adds invalid availability with bad day
    Given a user with email "alice@example.com" exists
    When Alice tries to add availability for day 8 from "09:00" to "11:00"
    Then the request should fail with error "Invalid dayOfWeek: 8. Must be 0-6."

  Scenario: User adds invalid availability with start time after end time
    Given a user with email "alice@example.com" exists
    When Alice tries to add availability for Monday from "11:00" to "09:00"
    Then the request should fail with error "startTime must be before endTime"

  Scenario: User deletes their own availability
    Given a user with email "alice@example.com" exists
    And Alice has availability for Monday from "09:00" to "11:00"
    When Alice deletes her Monday availability
    Then the availability should be deleted successfully
    And Alice should have no availability on Monday

  Scenario: User cannot delete another user's availability
    Given a user with email "alice@example.com" exists
    And a user with email "bob@example.com" exists
    And Alice has availability for Monday from "09:00" to "11:00"
    When Bob tries to delete Alice's Monday availability
    Then the request should fail with error "Permission denied"

  Scenario: Group availability shows density correctly
    Given a user with email "alice@example.com" exists
    And a user with email "bob@example.com" exists
    And a user with email "charlie@example.com" exists
    And a group "Team Alpha" exists with these members
    And Alice has availability for Monday from "09:00" to "11:00"
    And Bob has availability for Monday from "09:30" to "10:30"
    And Charlie has availability for Monday from "10:00" to "12:00"
    When I get group availability for Team Alpha
    Then the density for Monday "09:00" should be 0.33 with 1 available member
    And the density for Monday "09:30" should be 0.67 with 2 available members
    And the density for Monday "10:00" should be 1.0 with 3 available members
    And the density for Monday "10:30" should be 0.67 with 2 available members
    And the density for Monday "11:00" should be 0.33 with 1 available member

  Scenario: Empty group availability
    Given a user with email "alice@example.com" exists
    And a user with email "bob@example.com" exists
    And a user with email "charlie@example.com" exists
    And a group "Team Alpha" exists with these members
    When I get group availability for Team Alpha
    Then all time slots should have 0 density
    And total members should be 3