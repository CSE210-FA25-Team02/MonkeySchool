Feature: Attendance System

  Scenario: Professor creates an attendance poll
    Given a professor "Prof Smith" exists
    And a class "CSE 210" exists
    And the professor teaches the class
    And a course session "Lecture 1" exists for the class
    When the professor creates an attendance poll for the session with duration 10 minutes
    Then an attendance poll should exist with a unique 8-digit code
    And the poll should expire in 10 minutes

  Scenario: Student submits valid attendance code
    Given a professor "Prof Smith" exists
    And a class "CSE 210" exists
    And a student "Alice" exists
    And the student is enrolled in the class
    And a course session "Lecture 1" exists for the class
    And an active attendance poll exists for the session
    When the student submits the attendance code
    Then an attendance record should be created for the student and session
    And the record should show the student as present

  Scenario: Student submits expired code
    Given a professor "Prof Smith" exists
    And a class "CSE 210" exists
    And a student "Alice" exists
    And the student is enrolled in the class
    And a course session "Lecture 1" exists for the class
    And an expired attendance poll exists for the session
    When the student submits the expired attendance code
    Then the submission should be rejected with "Code expired" error

  Scenario: Student submits duplicate attendance
    Given a professor "Prof Smith" exists
    And a class "CSE 210" exists
    And a student "Alice" exists
    And the student is enrolled in the class
    And a course session "Lecture 1" exists for the class
    And an active attendance poll exists for the session
    And the student has already marked attendance for the session
    When the student submits the attendance code again
    Then the submission should be rejected with "Already marked" error

  Scenario: Unenrolled student cannot submit attendance
    Given a professor "Prof Smith" exists
    And a class "CSE 210" exists
    And a student "Bob" exists
    And the student is NOT enrolled in the class
    And a course session "Lecture 1" exists for the class
    And an active attendance poll exists for the session
    When the student submits the attendance code
    Then the submission should be rejected with "Not enrolled" error

  Scenario: Professor views session attendance
    Given a professor "Prof Smith" exists
    And a class "CSE 210" exists
    And multiple students are enrolled in the class
    And a course session "Lecture 1" exists for the class
    And attendance records exist for the session
    When the professor requests session attendance
    Then the professor should see a list of students who marked attendance
    And each record should show student name, email, and timestamp

