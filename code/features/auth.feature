Feature: Authentication with Google OAuth

  Scenario: Get Google OAuth authorization URL
    Given the test environment is configured
    When I request the Google OAuth authorization URL
    Then I should receive a valid Google OAuth URL
    And the URL should contain the client ID
    And the URL should contain the redirect URI
    And the URL should contain the correct scopes

  Scenario: Generate JWT token for user
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    When I generate a JWT token for the user
    Then I should receive a valid JWT token
    And the token should contain the user ID
    And the token should contain the user email

  Scenario: Verify valid JWT token
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I verify the JWT token
    Then the token should be valid
    And I should receive the user ID
    And I should receive the user email

  Scenario: Verify invalid JWT token
    When I verify an invalid JWT token
    Then I should receive an unauthorized error

  Scenario: Verify expired JWT token
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And an expired JWT token has been generated for the user
    When I verify the expired JWT token
    Then I should receive an unauthorized error

  Scenario: Authenticate with valid JWT token in header
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I make an authenticated request with the token in the Authorization header
    Then the request should succeed
    And I should receive the user information

  Scenario: Authenticate with valid JWT token in cookie
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I make an authenticated request with the token in a cookie
    Then the request should succeed
    And I should receive the user information

  Scenario: Authenticate without token
    When I make an authenticated request without a token
    Then I should receive an unauthorized error

  Scenario: Get current user profile
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I request my current user profile with the token
    Then I should receive my user profile
    And the profile should contain my email
    And the profile should contain my name

  Scenario: Get current user profile via HTMX
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I request my current user profile via HTMX with the token
    Then I should receive my user profile as HTML
    And the HTML should contain my email
    And the HTML should contain my name

  Scenario: Logout user
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I logout
    Then the logout should succeed
    And the token cookie should be cleared

  Scenario: Logout user via HTMX
    Given a user with email "test@ucsd.edu" and name "Test User" exists
    And a JWT token has been generated for the user
    When I logout via HTMX
    Then the logout should succeed
    And the response should be HTML

  Scenario: Handle Google callback with missing code
    When I handle the Google OAuth callback without a code
    Then I should receive a bad request error

  Scenario: Verify UCSD email is automatically authorized
    Given a user with email "student@ucsd.edu" and name "UCSD Student" exists
    When I check if the UCSD email is authorized
    Then the email should be authorized

  Scenario: Verify non-UCSD email authorization for existing user
    Given a user with email "existing@example.com" and name "Existing User" exists
    When I check if the existing user email is authorized
    Then the email should be authorized

