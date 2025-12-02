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

  Scenario: User's availability update reflects immediately in group calendar
    Given a user with email "alice@example.com" exists
    And a user with email "bob@example.com" exists
    And a class named "CSE 210" exists
    And a group named "Team Alpha" exists in class "CSE 210"
    And Alice is a member of group "Team Alpha"
    And Bob is a member of group "Team Alpha"
    And Alice has availability for Monday from "09:00" to "12:00"
    And Bob has availability for Monday from "10:00" to "14:00"
    When Alice requests group "Team Alpha" availability
    Then Alice should be shown as available on Monday from "09:00" to "12:00"
    When Alice updates her availability for Monday from "11:00" to "15:00"
    And Alice requests group "Team Alpha" availability again
    Then Alice should be shown as available on Monday from "11:00" to "15:00"
    And Bob should still be available on Monday from "10:00" to "14:00"

  Scenario: User can view multiple groups they belong to
    Given a user with email "alice@example.com" exists
    And a user with email "bob@example.com" exists
    And a user with email "charlie@example.com" exists
    And a class named "CSE 210" exists
    And a group named "Team Alpha" exists in class "CSE 210"
    And a group named "Team Beta" exists in class "CSE 210"
    And Alice is a member of group "Team Alpha"
    And Alice is a member of group "Team Beta"
    And Bob is a member of group "Team Alpha"
    And Charlie is a member of group "Team Beta"
    And Alice has availability for Monday from "09:00" to "12:00"
    And Bob has availability for Tuesday from "10:00" to "14:00"
    And Charlie has availability for Wednesday from "13:00" to "17:00"
    When Alice requests all her group availability
    Then she should see 2 groups
    And group "Team Alpha" should have 2 members
    And group "Team Beta" should have 2 members

  Scenario: Group availability shows correct overlap counts
    Given a user with email "alice@example.com" exists
    And a user with email "bob@example.com" exists
    And a user with email "charlie@example.com" exists
    And a class named "CSE 210" exists
    And a group named "Team Alpha" exists in class "CSE 210"
    And Alice is a member of group "Team Alpha"
    And Bob is a member of group "Team Alpha"
    And Charlie is a member of group "Team Alpha"
    And Alice has availability for Monday from "09:00" to "13:00"
    And Bob has availability for Monday from "10:00" to "14:00"
    And Charlie has availability for Monday from "11:00" to "15:00"
    When Alice checks group availability for Monday at "10:30"
    Then 2 members should be available at that time
    When Alice checks group availability for Monday at "11:30"
    Then 3 members should be available at that time
    When Alice checks group availability for Monday at "08:30"
    Then 0 members should be available at that time

