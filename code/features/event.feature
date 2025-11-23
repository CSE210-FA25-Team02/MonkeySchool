Feature: Event Management
  As a user in a class
  I want to create, view, and manage events
  So that I can coordinate scheduling with other class members

  Background:
    Given the following users exist:
      | name    | email               | preferredName |
      | Alice   | alice@example.com   | Alice         |
      | Bob     | bob@example.com     | Bob           |
      | Charlie | charlie@example.com | Charlie       |
    And the following class exists:
      | name     | quarter |
      | CSE 210  | FA24    |
    And the following class roles exist:
      | user    | class   | role      |
      | Alice   | CSE 210 | PROFESSOR |
      | Bob     | CSE 210 | STUDENT   |
      | Charlie | CSE 210 | TA        |
    And the following group exists:
      | name      | class   |
      | Team Alpha | CSE 210 |
    And the following group roles exist:
      | user | group      | role   |
      | Bob  | Team Alpha | LEADER |

  Scenario: Professor creates a course lecture
    When Alice creates an event:
      | title       | CSE 210 Lecture 1    |
      | description | Introduction to SE   |
      | type        | COURSE_LECTURE       |
      | startTime   | 2024-11-25T10:00:00Z |
      | endTime     | 2024-11-25T11:30:00Z |
      | location    | Room 101             |
    Then the event should be created successfully
    And the event should have type "COURSE_LECTURE"
    And the event creator should be "Alice"

  Scenario: TA creates office hours
    When Charlie creates an event:
      | title       | Office Hours        |
      | description | Help with homework  |
      | type        | COURSE_OFFICE_HOUR  |
      | startTime   | 2024-11-25T14:00:00Z |
      | endTime     | 2024-11-25T16:00:00Z |
      | location    | CSE Building        |
    Then the event should be created successfully
    And the event should have type "COURSE_OFFICE_HOUR"
    And the event creator should be "Charlie"

  Scenario: Student cannot create course lecture
    When Bob attempts to create an event:
      | title       | Unauthorized Lecture |
      | type        | COURSE_LECTURE       |
      | startTime   | 2024-11-25T10:00:00Z |
      | endTime     | 2024-11-25T11:30:00Z |
    Then the event creation should fail
    And the error should contain "does not have permission"

  Scenario: Group leader creates group meeting
    When Bob creates an event:
      | title       | Team Alpha Meeting  |
      | description | Sprint planning     |
      | type        | GROUP_MEETING       |
      | startTime   | 2024-11-25T15:00:00Z |
      | endTime     | 2024-11-25T16:00:00Z |
      | location    | Library Study Room  |
      | groupId     | Team Alpha          |
    Then the event should be created successfully
    And the event should have type "GROUP_MEETING"
    And the event should be associated with group "Team Alpha"

  Scenario: Student creates general event
    When Bob creates an event:
      | title       | Study Session       |
      | description | Prepare for midterm |
      | type        | OTHER               |
      | startTime   | 2024-11-25T19:00:00Z |
      | endTime     | 2024-11-25T21:00:00Z |
      | location    | Library             |
    Then the event should be created successfully
    And the event should have type "OTHER"


  Scenario: Get user event permissions
    When I check Bob's event permissions for class "CSE 210"
    Then Bob should be able to create "OTHER" events
    And Bob should be able to create "GROUP_MEETING" events
    And Bob should not be able to create "COURSE_LECTURE" events
    And Bob should not be able to create "COURSE_OFFICE_HOUR" events
    And Bob should not be able to create "COURSE_DISCUSSION" events