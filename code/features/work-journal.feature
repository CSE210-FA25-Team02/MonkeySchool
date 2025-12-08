Feature: Work Journal Management
  As a user
  I want to create, read, update, and delete work journal entries
  So that I can track my daily work and mood

  Scenario: Create a work journal entry with content only
    Given a logged-in user "Alice" with email "alice@ucsd.edu" exists
    When the user creates a work journal with content "Completed homework assignment 5"
    Then the work journal should be created successfully
    And the journal should have content "Completed homework assignment 5"
    And the journal should not have a mood

  Scenario: Create a work journal entry with content and mood
    Given a logged-in user "Bob" with email "bob@ucsd.edu" exists
    When the user creates a work journal with content "Finished project milestone" and mood "😊"
    Then the work journal should be created successfully
    And the journal should have content "Finished project milestone"
    And the journal should have mood "😊"

  Scenario: Create a work journal entry with empty mood
    Given a logged-in user "Charlie" with email "charlie@ucsd.edu" exists
    When the user creates a work journal with content "Worked on debugging" and mood ""
    Then the work journal should be created successfully
    And the journal should have content "Worked on debugging"
    And the journal should not have a mood

  Scenario: Cannot create work journal with empty content
    Given a logged-in user "Diana" with email "diana@ucsd.edu" exists
    When the user attempts to create a work journal with content ""
    Then the user should receive an error response with status 400
    And the error message should contain "Content is required"

  Scenario: Cannot create work journal with whitespace-only content
    Given a logged-in user "Eve" with email "eve@ucsd.edu" exists
    When the user attempts to create a work journal with content "   "
    Then the user should receive an error response with status 400
    And the error message should contain "Content is required"

  Scenario: Get all work journals for the current user
    Given a logged-in user "Frank" with email "frank@ucsd.edu" exists
    And a work journal with content "First entry" exists for user "Frank"
    And a work journal with content "Second entry" exists for user "Frank"
    When the user retrieves all their work journals
    Then the response should contain 2 work journals
    And the journals should be ordered by most recent first
    And the first journal should have content "Second entry"

  Scenario: Get all work journals when user has none
    Given a logged-in user "Grace" with email "grace@ucsd.edu" exists
    When the user retrieves all their work journals
    Then the response should contain 0 work journals

  Scenario: Get a specific work journal by ID
    Given a logged-in user "Henry" with email "henry@ucsd.edu" exists
    And a work journal with content "My journal entry" and mood "😐" exists for user "Henry"
    When the user retrieves the work journal by ID
    Then the response should contain the work journal
    And the journal should have content "My journal entry"
    And the journal should have mood "😐"

  Scenario: Cannot get a work journal that doesn't exist
    Given a logged-in user "Iris" with email "iris@ucsd.edu" exists
    When the user attempts to retrieve a work journal with invalid ID "nonexistent-id"
    Then the user should receive an error response with status 404
    And the error message should contain "Work journal not found"

  Scenario: Cannot get another user's work journal
    Given a logged-in user "Jack" with email "jack@ucsd.edu" exists
    And a logged-in user "Jill" with email "jill@ucsd.edu" exists
    And a work journal with content "Private entry" exists for user "Jill"
    When user "Jack" attempts to retrieve user "Jill"'s work journal
    Then user "Jack" should receive an error response with status 404
    And the error message should contain "Work journal not found"

  Scenario: Update work journal content
    Given a logged-in user "Kevin" with email "kevin@ucsd.edu" exists
    And a work journal with content "Original content" exists for user "Kevin"
    When the user updates the work journal with content "Updated content"
    Then the work journal should be updated successfully
    And the journal should have content "Updated content"

  Scenario: Update work journal mood
    Given a logged-in user "Laura" with email "laura@ucsd.edu" exists
    And a work journal with content "My work" and mood "😊" exists for user "Laura"
    When the user updates the work journal with mood "😫"
    Then the work journal should be updated successfully
    And the journal should have mood "😫"
    And the journal should still have content "My work"

  Scenario: Update both work journal content and mood
    Given a logged-in user "Mike" with email "mike@ucsd.edu" exists
    And a work journal with content "Old content" and mood "😐" exists for user "Mike"
    When the user updates the work journal with content "New content" and mood "😊"
    Then the work journal should be updated successfully
    And the journal should have content "New content"
    And the journal should have mood "😊"

  Scenario: Remove mood from work journal
    Given a logged-in user "Nancy" with email "nancy@ucsd.edu" exists
    And a work journal with content "My entry" and mood "😊" exists for user "Nancy"
    When the user updates the work journal with mood ""
    Then the work journal should be updated successfully
    And the journal should not have a mood

  Scenario: Cannot update work journal with empty content
    Given a logged-in user "Oscar" with email "oscar@ucsd.edu" exists
    And a work journal with content "Some content" exists for user "Oscar"
    When the user attempts to update the work journal with content ""
    Then the user should receive an error response with status 400
    And the error message should contain "Content cannot be empty"

  Scenario: Cannot update another user's work journal
    Given a logged-in user "Paul" with email "paul@ucsd.edu" exists
    And a logged-in user "Patricia" with email "patricia@ucsd.edu" exists
    And a work journal with content "Private journal" exists for user "Patricia"
    When user "Paul" attempts to update user "Patricia"'s work journal
    Then user "Paul" should receive an error response with status 404
    And the error message should contain "Work journal not found"

  Scenario: Delete a work journal entry
    Given a logged-in user "Quinn" with email "quinn@ucsd.edu" exists
    And a work journal with content "To be deleted" exists for user "Quinn"
    When the user deletes the work journal
    Then the work journal should be deleted successfully
    And the work journal should no longer exist

  Scenario: Cannot delete a work journal that doesn't exist
    Given a logged-in user "Rachel" with email "rachel@ucsd.edu" exists
    When the user attempts to delete a work journal with invalid ID "nonexistent-id"
    Then the user should receive an error response with status 404
    And the error message should contain "Work journal not found"

  Scenario: Cannot delete another user's work journal
    Given a logged-in user "Steve" with email "steve@ucsd.edu" exists
    And a logged-in user "Susan" with email "susan@ucsd.edu" exists
    And a work journal with content "Private journal" exists for user "Susan"
    When user "Steve" attempts to delete user "Susan"'s work journal
    Then user "Steve" should receive an error response with status 404
    And the error message should contain "Work journal not found"

  Scenario: Work journal content is trimmed
    Given a logged-in user "Tom" with email "tom@ucsd.edu" exists
    When the user creates a work journal with content "  Trimmed content  "
    Then the work journal should be created successfully
    And the journal should have content "Trimmed content"

  Scenario: Update work journal content is trimmed
    Given a logged-in user "Uma" with email "uma@ucsd.edu" exists
    And a work journal with content "Original" exists for user "Uma"
    When the user updates the work journal with content "  Updated content  "
    Then the work journal should be updated successfully
    And the journal should have content "Updated content"

