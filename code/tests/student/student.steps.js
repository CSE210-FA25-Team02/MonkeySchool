/**
 * Student Management Tests
 */

import { loadFeature, defineFeature } from "jest-cucumber";
import { context } from "../steps.context.js";
import * as shared from "./student.steps.shared.js";
import { resetDatabase } from "../utils/reset-db.js";

const feature = loadFeature("./features/student.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.student = undefined;
    context.response = undefined;
  });

  test("Create a new student via HTMX", ({ given, when, then, and }) => {
    given(
      /^a student with name "(.*)" and email "(.*)"$/,
      shared.aStudentWithNameAndEmail
    );
    when("I create the student", shared.iCreateTheStudent);
    then(
      "the student should be created successfully",
      shared.theStudentShouldBeCreatedSuccessfully
    );
    and(
      /^the student should have the name "(.*)"$/,
      shared.theStudentShouldHaveTheName
    );
    and(
      /^the student should have the email "(.*)"$/,
      shared.theStudentShouldHaveTheEmail
    );
  });

  test("Get all students via HTMX", ({ given, when, then, and }) => {
    given(
      /^a student with name "(.*)" and email "(.*)" has been created$/,
      shared.aStudentWithNameAndEmailHasBeenCreated
    );
    when("I get all students", shared.iGetAllStudents);
    then(
      "the response should contain at least one student",
      shared.theResponseShouldContainAtLeastOneStudent
    );
    and(
      /^the response should contain a student with name "(.*)"$/,
      shared.theResponseShouldContainStudentWithName
    );
    and(
      "the response should be accessible",
      shared.theResponseShouldBeAccessible
    );
  });

  test("Get a student by ID via HTMX", ({ given, when, then, and }) => {
    given(
      /^a student with name "(.*)" and email "(.*)" has been created$/,
      shared.aStudentWithNameAndEmailHasBeenCreated
    );
    when("I get the student by their ID", shared.iGetTheStudentById);
    then(
      "the student should be returned successfully",
      shared.theStudentShouldBeReturnedSuccessfully
    );
    and(
      /^the student should have the name "(.*)"$/,
      shared.theStudentShouldHaveTheName
    );
    and(
      "the response should be accessible",
      shared.theResponseShouldBeAccessible
    );
  });

  test("Get a student by ID that does not exist via HTMX", ({
    when,
    then,
    and,
  }) => {
    when(
      "I get a student by a non-existent ID",
      shared.iGetAStudentByNonExistentId
    );
    then(
      /^the response status should be (\d+)$/,
      shared.theResponseStatusShouldBe
    );
    and(
      "the response should contain an error message",
      shared.theResponseShouldContainAnErrorMessage
    );
    and(
      "the response should be accessible",
      shared.theResponseShouldBeAccessible
    );
  });

  test("Navigate to create student form via HTMX", ({ when, then, and }) => {
    when(
      "I navigate to the create student form",
      shared.iNavigateToCreateStudentForm
    );
    then(
      /^the response status should be (\d+)$/,
      shared.theResponseStatusShouldBe
    );
    and(
      "the response should contain a form",
      shared.theResponseShouldContainAForm
    );
  });

  test("Edit student form via HTMX", ({ given, when, then, and }) => {
    given(
      /^a student with name "(.*)" and email "(.*)" has been created$/,
      shared.aStudentWithNameAndEmailHasBeenCreated
    );
    when("I edit the student", shared.iEditTheStudent);
    then(
      /^the response status should be (\d+)$/,
      shared.theResponseStatusShouldBe
    );
    and(
      "the response should contain a form",
      shared.theResponseShouldContainAForm
    );
    and(
      /^the form should be prefilled with "(.*)" and "(.*)"$/,
      shared.theFormShouldBePrefilledWith
    );
  });

  test("Update student via HTMX", ({ given, when, then, and }) => {
    given(
      /^a student with name "(.*)" and email "(.*)" has been created$/,
      shared.aStudentWithNameAndEmailHasBeenCreated
    );
    when(
      /^I update the student with "(.*)" and "(.*)"$/,
      shared.iUpdateTheStudentWith
    );
    then(
      "the student should be updated successfully",
      shared.theStudentShouldBeUpdatedSuccessfully
    );
    and(
      "the response should contain a success message",
      shared.theResponseShouldContainASuccessMessage
    );
    and(
      "the response should be accessible",
      shared.theResponseShouldBeAccessible
    );
  });

  test("Delete student via HTMX", ({ given, when, then }) => {
    given(
      /^a student with name "(.*)" and email "(.*)" has been created$/,
      shared.aStudentWithNameAndEmailHasBeenCreated
    );
    when("I delete the student", shared.iDeleteTheStudent);
    then(
      "the student should be deleted successfully",
      shared.theStudentShouldBeDeletedSuccessfully
    );
  });

  test("Handle validation errors in HTMX form", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a student with name "(.*)" and email "(.*)"$/,
      shared.aStudentWithNameAndEmail
    );
    when("I create the student", shared.iCreateTheStudent);
    then(
      /^the response status should be (\d+)$/,
      shared.theResponseStatusShouldBe
    );
    and(
      "the response should contain an error message",
      shared.theResponseShouldContainAnErrorMessage
    );
    and(
      "the response should be accessible",
      shared.theResponseShouldBeAccessible
    );
  });

  test("Handle duplicate email error via HTMX", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a student with name "(.*)" and email "(.*)" has been created$/,
      shared.aStudentWithNameAndEmailHasBeenCreated
    );
    and(
      /^a student with name "(.*)" and email "(.*)"$/,
      shared.aStudentWithNameAndEmail
    );
    when("I create the student", shared.iCreateTheStudent);
    then(
      /^the response status should be (\d+)$/,
      shared.theResponseStatusShouldBe
    );
    and(
      "the response should contain an error message",
      shared.theResponseShouldContainAnErrorMessage
    );
  });
});
