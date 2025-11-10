Feature: Authentication
  As a user
  I want to authenticate with my UCSD Gmail account
  So that I can access the application

  Scenario: UCSD email is allowed to login
    Given a UCSD email "user@ucsd.edu"
    When I check if the email is allowed
    Then the email should be allowed

  Scenario: Non-UCSD email not in CSV is not allowed
    Given a non-UCSD email "user@example.com" not in the CSV file
    When I check if the email is allowed
    Then the email should not be allowed

  Scenario: Non-UCSD email in CSV is allowed
    Given a non-UCSD email "external@example.com" in the CSV file
    When I check if the email is allowed
    Then the email should be allowed

  Scenario: Get session returns null when not authenticated
    When I request the current session
    Then the response should indicate no user is logged in

  Scenario: Logout clears authentication
    Given a user is logged in
    When I logout
    Then I should be logged out

