Feature: Availability Management
  As a user
  I want to set and manage my weekly availability
  So that others can see when I'm available

  Scenario: Set weekly availability for a user
    Given a logged-in user "Alice" with email "alice@ucsd.edu" exists
    When the user sets weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 08:00     | 12:00   |
      | 1         | 14:00     | 18:00   |
      | 3         | 09:00     | 11:00   |
    Then the availability should be saved successfully
    And the user should have 3 availability records

  Scenario: Replace existing availability when setting new availability
    Given a logged-in user "Bob" with email "bob@ucsd.edu" exists
    And the user has existing availability for day 1 from 10:00 to 12:00
    When the user sets weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 2         | 14:00     | 16:00   |
    Then the availability should be saved successfully
    And the user should have 1 availability record
    And the user should have availability for day 2 from 14:00 to 16:00
    And the user should not have availability for day 1 from 10:00 to 12:00

  Scenario: Set availability for all days of the week
    Given a logged-in user "Charlie" with email "charlie@ucsd.edu" exists
    When the user sets weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 0         | 08:00     | 12:00   |
      | 1         | 08:00     | 12:00   |
      | 2         | 08:00     | 12:00   |
      | 3         | 08:00     | 12:00   |
      | 4         | 08:00     | 12:00   |
      | 5         | 08:00     | 12:00   |
      | 6         | 08:00     | 12:00   |
    Then the availability should be saved successfully
    And the user should have 7 availability records

  Scenario: Cannot set availability with invalid day of week
    Given a logged-in user "Diana" with email "diana@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 7         | 08:00     | 12:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid dayOfWeek"

  Scenario: Cannot set availability with invalid day of week negative
    Given a logged-in user "Eve" with email "eve@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | -1        | 08:00     | 12:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid dayOfWeek"

  Scenario: Cannot set availability with invalid start time format
    Given a logged-in user "Frank" with email "frank@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 25:00     | 12:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid startTime"

  Scenario: Cannot set availability with invalid end time format
    Given a logged-in user "Grace" with email "grace@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 08:00     | 25:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid endTime"

  Scenario: Cannot set availability with start time after end time
    Given a logged-in user "Henry" with email "henry@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 14:00     | 10:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "startTime must be before endTime"

  Scenario: Cannot set availability with start time equal to end time
    Given a logged-in user "Iris" with email "iris@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 10:00     | 10:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "startTime must be before endTime"

  Scenario: Cannot set availability with time before 8:00
    Given a logged-in user "Jack" with email "jack@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 07:00     | 10:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid startTime"

  Scenario: Cannot set availability with time after 20:00
    Given a logged-in user "Jill" with email "jill@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 10:00     | 21:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid endTime"

  Scenario: Cannot set availability with invalid time format
    Given a logged-in user "Kevin" with email "kevin@ucsd.edu" exists
    When the user attempts to set weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 8:00      | 12:00   |
    Then the user should receive an error response with status 500
    And the error message should contain "Invalid startTime"

  Scenario: Get user availability
    Given a logged-in user "Laura" with email "laura@ucsd.edu" exists
    And the user has availability for day 1 from 08:00 to 12:00
    And the user has availability for day 3 from 14:00 to 18:00
    When the user retrieves their availability
    Then the response should contain 2 availability records
    And the availability should be ordered by day and time

  Scenario: Get user availability when user has none
    Given a logged-in user "Mike" with email "mike@ucsd.edu" exists
    When the user retrieves their availability
    Then the response should contain 0 availability records

  Scenario: Set empty availability clear all
    Given a logged-in user "Nancy" with email "nancy@ucsd.edu" exists
    And the user has availability for day 1 from 08:00 to 12:00
    When the user sets weekly availability with no ranges
    Then the availability should be saved successfully
    And the user should have 0 availability records

  Scenario: Set availability with 30-minute intervals
    Given a logged-in user "Oscar" with email "oscar@ucsd.edu" exists
    When the user sets weekly availability with ranges:
      | dayOfWeek | startTime | endTime |
      | 1         | 08:30     | 12:30   |
      | 1         | 14:30     | 18:30   |
    Then the availability should be saved successfully
    And the user should have 2 availability records

  Scenario: Cannot set availability with invalid data format
    Given a logged-in user "Paul" with email "paul@ucsd.edu" exists
    When the user attempts to set weekly availability with invalid format
    Then the user should receive an error response with status 500
    And the error message should contain "not valid json"
