Feature: Event Calendar
  As a user
  I want to view, edit, and delete events in the calendar
  So that I can manage course events effectively

  Background:
    Given the database is reset
    And a logged-in professor "Dr. Smith" with email "professor@ucsd.edu" exists
    And a logged-in student "John Doe" with email "student@ucsd.edu" exists
    And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
    And "John Doe" is enrolled in "CSE 210" as a student

  Scenario: View event details in modal
    Given an event "Lecture 1" of type "COURSE_LECTURE" exists for class "CSE 210" created by "Dr. Smith"
    When I click on the event "Lecture 1"
    Then I should see a modal with event details
    And the modal should display the event title "Lecture 1"
    And the modal should display the event type "Lecture"
    And the modal should have an "Edit" button
    And the modal should have a "Delete" button

  Scenario: View event details as student (read-only)
    Given an event "Office Hours" of type "COURSE_OFFICE_HOUR" exists for class "CSE 210" created by "Dr. Smith"
    When I am logged in as "John Doe"
    And I click on the event "Office Hours"
    Then I should see a modal with event details
    And the modal should not have an "Edit" button
    And the modal should not have a "Delete" button

  Scenario: Edit an event
    Given an event "Lecture 1" of type "COURSE_LECTURE" exists for class "CSE 210" created by "Dr. Smith"
    When I click on the event "Lecture 1"
    And I click the "Edit" button
    Then I should see an edit form with the event details pre-filled
    When I update the event title to "Lecture 1 - Updated"
    And I submit the edit form
    Then the event should be updated with title "Lecture 1 - Updated"
    And the calendar should refresh to show the updated event

  Scenario: Delete an event
    Given an event "Lecture 1" of type "COURSE_LECTURE" exists for class "CSE 210" created by "Dr. Smith"
    When I click on the event "Lecture 1"
    And I click the "Delete" button
    And I confirm the deletion
    Then the event "Lecture 1" should be deleted
    And the calendar should refresh without the deleted event

  Scenario: Student cannot edit professor's event
    Given an event "Lecture 1" of type "COURSE_LECTURE" exists for class "CSE 210" created by "Dr. Smith"
    When I am logged in as "John Doe"
    And I try to edit the event "Lecture 1"
    Then I should receive a permission error
    And the event should not be modified

  Scenario: Student cannot delete professor's event
    Given an event "Lecture 1" of type "COURSE_LECTURE" exists for class "CSE 210" created by "Dr. Smith"
    When I am logged in as "John Doe"
    And I try to delete the event "Lecture 1"
    Then I should receive a permission error
    And the event should not be deleted

  Scenario: Group leader can edit group meeting
    Given a group "Group A" exists for class "CSE 210"
    And "John Doe" is a leader of "Group A"
    And an event "Group Meeting" of type "GROUP_MEETING" exists for class "CSE 210" and group "Group A" created by "Dr. Smith"
    When I am logged in as "John Doe"
    And I click on the event "Group Meeting"
    Then I should see a modal with event details
    And the modal should have an "Edit" button
    When I click the "Edit" button
    And I update the event title to "Group Meeting - Updated"
    And I submit the edit form
    Then the event should be updated with title "Group Meeting - Updated"

  Scenario: Calendar displays events for current week
    Given an event "Lecture 1" of type "COURSE_LECTURE" exists for class "CSE 210" created by "Dr. Smith" on "2025-12-02"
    And an event "Office Hours" of type "COURSE_OFFICE_HOUR" exists for class "CSE 210" created by "Dr. Smith" on "2025-12-03"
    When I view the calendar for class "CSE 210" for the week starting "2025-12-01"
    Then I should see "Lecture 1" in the calendar
    And I should see "Office Hours" in the calendar

  Scenario: Calendar shows correct day names
    When I view the calendar for class "CSE 210" for the week starting "2025-12-01"
    Then "December 1, 2025" should be displayed as "Monday"
    And "December 2, 2025" should be displayed as "Tuesday"
    And "December 3, 2025" should be displayed as "Wednesday"

  Scenario: Create event via calendar
    When I click "Create Event" on the calendar for class "CSE 210"
    Then I should see a create event form
    When I fill in the event form with:
      | Field      | Value         |
      | Title      | New Lecture   |
      | Type       | COURSE_LECTURE|
      | Date       | 2026-12-10    |
      | Start Time | 10:00         |
      | End Time   | 11:30         |
    And I submit the create event form
    Then a new event "New Lecture" should be created
    And the calendar should refresh to show the new event

