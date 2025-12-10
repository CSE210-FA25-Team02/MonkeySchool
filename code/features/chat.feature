Feature: Chat Interface
  As a student
  I want to chat with professors, TAs, and tutors
  So that I can ask questions and get help with my coursework

  Background:
    Given a class "CSE 210" exists
    And a logged-in student "Alice" with email "alice@ucsd.edu" exists
    And a logged-in professor "Prof. Smith" with email "prof.smith@ucsd.edu" exists
    And a logged-in TA "TA Bob" with email "ta.bob@ucsd.edu" exists
    And a logged-in tutor "Tutor Carol" with email "tutor.carol@ucsd.edu" exists
    And "Alice" is enrolled in "CSE 210" as a "STUDENT"
    And "Prof. Smith" is enrolled in "CSE 210" as a "PROFESSOR"
    And "TA Bob" is enrolled in "CSE 210" as a "TA"
    And "Tutor Carol" is enrolled in "CSE 210" as a "TUTOR"

  Scenario: Student views chat page with available recipients
    When the student views the chat page
    Then the chat page should be displayed
    And the page should show a list of available recipients including "Prof. Smith", "TA Bob", and "Tutor Carol"

  Scenario: Student starts a conversation with a professor
    When the student starts a conversation with "Prof. Smith"
    Then a conversation should be created between the student and "Prof. Smith"
    And the conversation view should be displayed

  Scenario: Student sends a message to a professor
    Given a conversation exists between "Alice" and "Prof. Smith" in "CSE 210"
    When the student sends a message "Hello, I have a question about the homework"
    Then the message should be created successfully
    And the message should have content "Hello, I have a question about the homework"
    And the message should be visible in the conversation

  Scenario: Student sends multiple messages in a conversation
    Given a conversation exists between "Alice" and "TA Bob" in "CSE 210"
    When the student sends a message "Hi TA Bob"
    And the student sends another message "Can you help me with lab 3?"
    Then there should be 2 messages in the conversation
    And both messages should be visible in chronological order

  Scenario: Student views conversation list
    Given a conversation exists between "Alice" and "Prof. Smith" in "CSE 210"
    And a conversation exists between "Alice" and "TA Bob" in "CSE 210"
    When the student views the chat page
    Then the conversation list should show 2 conversations
    And the conversations should be ordered by most recent first

  Scenario: Student cannot send empty message
    Given a conversation exists between "Alice" and "Prof. Smith" in "CSE 210"
    When the student attempts to send an empty message
    Then the user should receive an error response with status 400
    And the error message should contain "Message content is required"

  Scenario: Student can view messages in chronological order
    Given a conversation exists between "Alice" and "Tutor Carol" in "CSE 210"
    And the student sends a message "First message"
    And the student sends a message "Second message"
    And the student sends a message "Third message"
    When the student views the conversation
    Then the messages should be displayed in chronological order
    And "First message" should appear before "Second message"
    And "Second message" should appear before "Third message"

  Scenario: Student can start conversation with TA
    When the student starts a conversation with "TA Bob"
    Then a conversation should be created between the student and "TA Bob"
    And the conversation should be linked to "CSE 210"

  Scenario: Student can start conversation with tutor
    When the student starts a conversation with "Tutor Carol"
    Then a conversation should be created between the student and "Tutor Carol"
    And the conversation should be linked to "CSE 210"

  Scenario: Conversation shows correct recipient information
    Given a conversation exists between "Alice" and "Prof. Smith" in "CSE 210"
    When the student views the conversation
    Then the conversation header should display "Prof. Smith" as the recipient
    And the conversation header should show "CSE 210" as the class context
