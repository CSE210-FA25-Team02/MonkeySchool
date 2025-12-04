Feature: Attendance Management
    
    Scenario: Professor creates an attendance poll
        Given a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        When the professor creates an attendance poll for session "Lecture 1" with duration "15" minutes
        Then the professor receives a new attendance poll with an 8-digit code
        And the poll expires in "15" minutes

    Scenario: Professor creates an attendance poll with default duration
        Given a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        When the professor creates an attendance poll for session "Lecture 1" without duration
        Then the professor receives a new attendance poll with an 8-digit code
        And the poll expires with default duration

    Scenario: Student submits attendance with valid code
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an active attendance poll with code "12345678" exists for session "Lecture 1"
        When the student submits attendance with code "12345678"
        Then the student receives a success response
        And an attendance record is created for "Alice Student" in session "Lecture 1"

    Scenario: Student marks attendance with course selection
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an active attendance poll with code "12345678" exists for session "Lecture 1"
        When the student marks attendance with code "12345678" for course "CSE 210"
        Then the student receives a success response
        And an attendance record is created for "Alice Student" in session "Lecture 1"

    Scenario: Student cannot submit attendance with invalid code
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        When the student submits attendance with code "00000000"
        Then the student receives an error response with message "Invalid code"

    Scenario: Student cannot submit attendance with expired code
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an expired attendance poll with code "12345678" exists for session "Lecture 1"
        When the student submits attendance with code "12345678"
        Then the student receives an error response with message "Code expired"

    Scenario: Student cannot submit attendance twice for same session
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an active attendance poll with code "12345678" exists for session "Lecture 1"
        And an attendance record exists for "Alice Student" in session "Lecture 1"
        When the student submits attendance with code "12345678"
        Then the student receives an error response with message "Already marked attendance for this session"

    Scenario: Student cannot submit attendance if not enrolled
        Given a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an active attendance poll with code "12345678" exists for session "Lecture 1"
        When the student submits attendance with code "12345678"
        Then the student receives an error response with message "Not enrolled in course"

    Scenario: Non-professor cannot create attendance poll
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a course session "Lecture 1" exists for class "CSE 210"
        When the student attempts to create an attendance poll for session "Lecture 1"
        Then the student receives an error response with message "Only professors can create attendance polls"

    Scenario: Professor cannot create poll for session they don't teach
        Given a logged-in professor "Dr. Jones" with email "jones@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        When professor "Dr. Jones" attempts to create an attendance poll for session "Lecture 1"
        Then the professor receives an error response with message "Only professors can create attendance polls"

    Scenario: Professor views session attendance records
        Given a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And an active attendance poll with code "12345678" exists for session "Lecture 1"
        And an attendance record exists for "Alice Student" in session "Lecture 1"
        When the professor views attendance records for session "Lecture 1"
        Then the professor receives attendance records
        And the records include "Alice Student"

    Scenario: Professor views course attendance summary
        Given a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And a course session "Lecture 2" exists for class "CSE 210"
        And a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And an attendance record exists for "Alice Student" in session "Lecture 1"
        When the professor views attendance summary for course "CSE 210"
        Then the professor receives attendance summary
        And the summary includes session "Lecture 1"
        And the summary includes session "Lecture 2"

    Scenario: Student views their own attendance history
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an attendance record exists for "Alice Student" in session "Lecture 1"
        When the student views their attendance history
        Then the student receives their attendance history
        And the history includes session "Lecture 1"

    Scenario: Student cannot view another student's attendance
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in student "Bob Student" with email "bob@university.edu" exists
        And a class named "CSE 210" exists and includes "Bob Student" as a student
        And a course session "Lecture 1" exists for class "CSE 210"
        And an attendance record exists for "Bob Student" in session "Lecture 1"
        When student "Alice Student" attempts to view attendance for "Bob Student"
        Then the student receives an error response with message "You can only view your own attendance records"

    Scenario: Student submits attendance with code containing spaces
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a logged-in professor "Dr. Smith" with email "prof@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        And a class named "CSE 210" exists and includes "Dr. Smith" as a professor
        And a course session "Lecture 1" exists for class "CSE 210"
        And an active attendance poll with code "12345678" exists for session "Lecture 1"
        When the student marks attendance with code "1234 5678" for course "CSE 210"
        Then the student receives a success response
        And an attendance record is created for "Alice Student" in session "Lecture 1"

    Scenario: Student submits attendance with invalid code format
        Given a logged-in student "Alice Student" with email "alice@university.edu" exists
        And a class named "CSE 210" exists and includes "Alice Student" as a student
        When the student submits attendance with code "12345"
        Then the student receives an error response with message "Code must be exactly 8 digits"


