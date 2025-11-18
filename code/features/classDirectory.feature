Feature: Class Directory Management

  Scenario: Get directory for empty class
    Given a class named "Empty Class" exists
    When I request the directory for "Empty Class"
    Then the directory should be empty
    And the directory should contain class information

  Scenario: Get directory with professors only
    Given a class named "Professor Class" exists
    And the class has professor "Dr. Smith" with email "dr.smith@university.edu"
    When I request the directory for "Professor Class"
    Then the directory should contain 1 professor
    And the professor section should show "Dr. Smith"

  Scenario: Get directory with TAs and tutors
    Given a class named "Mixed Staff Class" exists
    And the class has TA "Jane Doe" with email "jane.doe@university.edu"
    And the class has tutor "Bob Wilson" with email "bob.wilson@university.edu"
    When I request the directory for "Mixed Staff Class"
    Then the directory should contain 1 TA
    And the directory should contain 1 tutor
    And the TA section should show "Jane Doe"
    And the tutor section should show "Bob Wilson"

  Scenario: Get directory with grouped students
    Given a class named "Group Class" exists
    And the class has student "Alice Student" with email "alice@university.edu"
    And the class has another student "Charlie Student" with email "charlie@university.edu"
    And there is a group named "Team Alpha" in the class
    And "Alice Student" is a leader in group "Team Alpha"
    And "Charlie Student" is a member in group "Team Alpha"
    When I request the directory for "Group Class"
    Then the directory should contain 1 group
    And the group "Team Alpha" should have 2 members
    And "Alice Student" should be marked as leader in "Team Alpha"

  Scenario: Get directory with ungrouped students
    Given a class named "Ungrouped Class" exists
    And the class has student "Solo Student" with email "solo@university.edu"
    When I request the directory for "Ungrouped Class"
    Then the directory should contain 1 ungrouped student
    And the ungrouped section should show "Solo Student"

  Scenario: Get directory with complete structure
    Given a class named "Full Class" exists
    And the class has professor "Dr. Johnson" with email "dr.j@university.edu"
    And the class has TA "Sarah TA" with email "sarah.ta@university.edu"
    And the class has tutor "Mark Tutor" with email "mark.tutor@university.edu"
    And the class has student "Group Leader" with email "leader@university.edu"
    And the class has another student "Group Member" with email "member@university.edu"
    And the class has a third student "Solo Student" with email "solo@university.edu"
    And there is a group named "Project Team" in the class
    And "Group Leader" is a leader in group "Project Team"
    And "Group Member" is a member in group "Project Team"
    When I request the directory for "Full Class"
    Then the directory should contain 1 professor
    And the directory should contain 1 TA
    And the directory should contain 1 tutor
    And the directory should contain 1 group
    And the directory should contain 1 ungrouped student
    And the total member count should be 6

  Scenario: Get directory for non-existent class
    When I request the directory for "Non-existent Class"
    Then the directory should not be found
    And the response should indicate class not found

  Scenario: Verify member details in directory
    Given a class named "Detail Class" exists
    And the class has student "Detailed Student" with the following details:
      | name         | Detailed Student           |
      | preferredName| Detail                     |
      | email        | detail@university.edu      |
      | pronunciation| dih-TAYL                   |
      | pronouns     | they/them                  |
      | phone        | +1-555-0123                |
      | github       | detailstudent              |
      | bio          | I love software engineering |
    When I request the directory for "Detail Class"
    Then the student details should include preferred name "Detail"
    And the student details should include pronunciation "dih-TAYL"
    And the student details should include pronouns "they/them"
    And the student details should include contact information

  Scenario: Verify group details in directory
    Given a class named "Group Detail Class" exists
    And the class has student "Leader Student" with email "leader@test.com"
    And there is a group named "Awesome Team" with the following details:
      | logoUrl | https://example.com/logo.png |
      | mantra  | We build amazing software    |
      | github  | awesome-team-repo            |
    And "Leader Student" is a leader in group "Awesome Team"
    When I request the directory for "Group Detail Class"
    Then the group "Awesome Team" should have logo "https://example.com/logo.png"
    And the group "Awesome Team" should have mantra "We build amazing software"
    And the group "Awesome Team" should have github "awesome-team-repo"