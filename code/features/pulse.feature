Feature: Pulse Check
  As a student
  I want to submit and view my pulse check
  So that instructors can track my engagement

  Scenario: Student submits a pulse check for today
    Given a logged-in student "Alice" with email "alice@ucsd.edu" exists
    And a class named "CSE 210" exists and includes "Alice" as a "STUDENT"
    When the student submits a pulse value of 4
    Then the pulse entry should be saved with value 4
    And the response should indicate success

  Scenario: Student updates their pulse check for today
    Given a logged-in student "Bob" with email "bob@ucsd.edu" exists
    And a class named "CSE 210" exists and includes "Bob" as a "STUDENT"
    And the student has already submitted a pulse value of 3 for today
    When the student submits a pulse value of 5
    Then the pulse entry should be updated to value 5
    And the response should indicate success

  Scenario: Student retrieves their pulse check for today
    Given a logged-in student "Charlie" with email "charlie@ucsd.edu" exists
    And a class named "CSE 210" exists and includes "Charlie" as a "STUDENT"
    And the student has already submitted a pulse value of 4 for today
    When the student retrieves their pulse for today
    Then the response should contain pulse value 4

  Scenario: Student retrieves pulse when none exists
    Given a logged-in student "Diana" with email "diana@ucsd.edu" exists
    And a class named "CSE 210" exists and includes "Diana" as a "STUDENT"
    When the student retrieves their pulse for today
    Then the response should contain pulse value null

  Scenario Outline: Student submits invalid pulse values
    Given a logged-in student "Eve" with email "eve@ucsd.edu" exists
    And a class named "CSE 210" exists and includes "Eve" as a "STUDENT"
    When the student submits a pulse value of <pulse>
    Then the response should indicate an error
    And the error message should mention "between 1 and 5"

    Examples:
      | pulse |
      | 0     |
      | 6     |
      | -1    |
      | 10    |

  Scenario: Non-student cannot submit pulse
    Given a logged-in user "Frank" with email "frank@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Frank" is not enrolled in "CSE 210"
    When "Frank" attempts to submit a pulse value of 4
    Then the response should indicate forbidden access
    And the error message should mention "student"

  Scenario: Student cannot submit pulse for class they're not enrolled in
    Given a logged-in student "Grace" with email "grace@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Grace" is not enrolled in "CSE 210"
    When "Grace" attempts to submit a pulse value of 4
    Then the response should indicate forbidden access
    And the error message should mention "student"

  Scenario: Instructor views pulse analytics for their class
    Given a logged-in instructor "Prof. Smith" with email "prof@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Prof. Smith" is a "PROFESSOR" in "CSE 210"
    And there are pulse entries for the last 7 days in "CSE 210"
    When the instructor requests pulse analytics with range 7
    Then the response should contain analytics data
    And the analytics should include average pulse values
    And the analytics should include entry counts

  Scenario: TA views pulse analytics
    Given a logged-in TA "TA User" with email "ta@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "TA User" is a "TA" in "CSE 210"
    And there are pulse entries for the last 7 days in "CSE 210"
    When the instructor requests pulse analytics with range 7
    Then the response should contain analytics data

  Scenario: Tutor views pulse analytics
    Given a logged-in tutor "Tutor User" with email "tutor@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Tutor User" is a "TUTOR" in "CSE 210"
    And there are pulse entries for the last 7 days in "CSE 210"
    When the instructor requests pulse analytics with range 7
    Then the response should contain analytics data

  Scenario: Student cannot view pulse analytics
    Given a logged-in student "Student User" with email "student@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Student User" is a "STUDENT" in "CSE 210"
    When "Student User" attempts to view pulse analytics
    Then the response should indicate forbidden access
    And the error message should mention "instructor"

  Scenario Outline: Instructor requests analytics with different ranges
    Given a logged-in instructor "Prof. Jones" with email "jones@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Prof. Jones" is a "PROFESSOR" in "CSE 210"
    And there are pulse entries for the last 30 days in "CSE 210"
    When the instructor requests pulse analytics with range <range>
    Then the response should contain analytics data
    And the analytics should cover <range> days

    Examples:
      | range |
      | 1     |
      | 7     |
      | 30    |

  Scenario: Instructor requests analytics with invalid range
    Given a logged-in instructor "Prof. Lee" with email "lee@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Prof. Lee" is a "PROFESSOR" in "CSE 210"
    When the instructor requests pulse analytics with range 15
    Then the response should indicate an error
    And the error message should mention "1, 7, or 30 days"

  Scenario: Instructor views pulse details for a specific date
    Given a logged-in instructor "Prof. Brown" with email "brown@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Prof. Brown" is a "PROFESSOR" in "CSE 210"
    And there are pulse entries for date "2025-12-01" in "CSE 210"
    When the instructor requests pulse details for date "2025-12-01"
    Then the response should contain pulse details
    And the details should include student names and pulse values

  Scenario: Instructor requests pulse details with invalid date
    Given a logged-in instructor "Prof. White" with email "white@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Prof. White" is a "PROFESSOR" in "CSE 210"
    When the instructor requests pulse details for date "invalid-date"
    Then the response should indicate an error
    And the error message should mention "Invalid date format"

  Scenario: Instructor views pulse analytics page
    Given a logged-in instructor "Prof. Green" with email "green@ucsd.edu" exists
    And a class named "CSE 210" exists
    And "Prof. Green" is a "PROFESSOR" in "CSE 210"
    And there are pulse entries for the last 7 days in "CSE 210"
    When the instructor requests the pulse analytics page
    Then the response should be HTML
    And the HTML should contain pulse analytics data

