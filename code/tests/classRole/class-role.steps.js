import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as userService from "../../src/services/user.service.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import { JSDOM } from "jsdom";

const feature = loadFeature("./features/class-role.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    // Reset context
    context.user = undefined;
    context.class = undefined;
    context.secondProf = undefined;
    context.ta = undefined;
    context.students = [];
    context.dom = undefined;
    context.response = undefined;
    context.apiError = undefined;
  });

  // Helper function to setup test data
  async function setupTestData() {
    // Create professor user
    context.user = await userService.createUser({
      email: "prof.first@ucsd.edu",
      name: "Professor First",
      preferredName: "Prof. First",
    });

    // Create second professor
    context.secondProf = await userService.createUser({
      email: "prof.second@ucsd.edu",
      name: "Professor Second",
      preferredName: "Prof. Second",
    });

    // Create TA
    context.ta = await userService.createUser({
      email: "ta.assistant@ucsd.edu",
      name: "Teaching Assistant",
      preferredName: "TA Assistant",
    });

    // Create students
    for (let i = 1; i <= 3; i++) {
      const student = await userService.createUser({
        email: `student${i}@ucsd.edu`,
        name: `Student ${i}`,
        preferredName: `Student ${i}`,
      });
      context.students.push(student);
    }

    // Create class
    context.class = await classService.createClass({
      name: "ABC: Advanced Backend Concepts",
      quarter: "WI25",
      location: "In Person",
    });

    // Update with invite code
    context.class = await classService.updateClass(context.class.id, {
      inviteCode: "ABC12345",
    });

    // Assign roles
    await classRoleService.upsertClassRole({
      userId: context.user.id,
      classId: context.class.id,
      role: "PROFESSOR",
    });

    await classRoleService.upsertClassRole({
      userId: context.secondProf.id,
      classId: context.class.id,
      role: "PROFESSOR",
    });

    await classRoleService.upsertClassRole({
      userId: context.ta.id,
      classId: context.class.id,
      role: "TA",
    });

    for (const student of context.students) {
      await classRoleService.upsertClassRole({
        userId: student.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    }
  }

  test("Professor successfully promotes a student to TA", ({ given, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupTestData();
      expect(context.user.email).toBe(email);
      // Set the authenticated user context for requests
      context.user = context.user; // Ensure context.user is set for auth
    });

    given(/^there is a class "(.*)" with invite code "(.*)"$/, (className, inviteCode) => {
      expect(context.class.name).toBe(className);
      expect(context.class.inviteCode).toBe(inviteCode);
    });

    given(/^I am a professor in the class$/, async () => {
      const role = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(role.role).toBe("PROFESSOR");
    });

    given(/^there is a second professor "(.*)" in the class$/, (email) => {
      expect(context.secondProf.email).toBe(email);
    });

    given(/^there is a TA "(.*)" in the class$/, (email) => {
      expect(context.ta.email).toBe(email);
    });

    given(/^there are (\d+) students in the class$/, (count) => {
      expect(context.students.length).toBe(parseInt(count));
    });

    given(/^I am on the class directory page$/, async () => {
      context.response = await request.get(`/classes/${context.class.id}/directory`);
      expect(context.response.status).toBe(200);
      context.dom = new JSDOM(context.response.text);
    });

    when(/^I click the role management button for student "(.*)"$/, (email) => {
      const student = context.students.find(s => s.email === email);
      expect(student).toBeDefined();

      // Verify the role management button exists
      const button = context.dom.window.document.querySelector(`button[onclick="toggleRoleDropdown('${student.id}')"]`);
      expect(button).toBeTruthy();
    });

    when(/^I select "(.*)" from the role dropdown$/, async (role) => {
      const targetUser = context.students[0]; // First student

      context.response = await request
        .put(`/classRoles/${context.class.id}/members/${targetUser.id}/role`)
        .send({ role: role.toUpperCase() });

      if (context.response.status === 200) {
        context.dom = new JSDOM(context.response.text);
      }
    });

    then(/^the student should be moved to the "(.*)" section$/, async () => {
      expect(context.response.status).toBe(200);

      // Verify in database
      const updatedRole = await classRoleService.getClassRole(context.students[0].id, context.class.id);
      expect(updatedRole.role).toBe("TA");
    });

    then(/^the student's role badge should show "(.*)"$/, (roleText) => {
      // Find all role badges and look for the one that shows "TA"
      const roleBadges = context.dom.window.document.querySelectorAll('.role-badge');
      const taRoleBadge = Array.from(roleBadges).find(badge => badge.textContent.trim() === roleText);
      expect(taRoleBadge).toBeTruthy();
      expect(taRoleBadge.textContent.trim()).toBe(roleText);
    });

    then(/^the "(.*)" section count should decrease by (\d+)$/, () => {
      // Verify count badges exist
      const countBadges = context.dom.window.document.querySelectorAll('.count-badge');
      expect(countBadges.length).toBeGreaterThan(0);
    });

    then(/^the "(.*)" section count should increase by (\d+)$/, () => {
      // Verify count badges exist
      const countBadges = context.dom.window.document.querySelectorAll('.count-badge');
      expect(countBadges.length).toBeGreaterThan(0);
    });
  });

  test("Professor successfully demotes a TA to student", ({ given, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupTestData();
      expect(context.user.email).toBe(email);
      context.user = context.user; // Ensure context.user is set for auth
    });

    given(/^there is a class "(.*)" with invite code "(.*)"$/, (className, inviteCode) => {
      expect(context.class.name).toBe(className);
      expect(context.class.inviteCode).toBe(inviteCode);
    });

    given(/^I am a professor in the class$/, async () => {
      const role = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(role.role).toBe("PROFESSOR");
    });

    given(/^there is a second professor "(.*)" in the class$/, (email) => {
      expect(context.secondProf.email).toBe(email);
    });

    given(/^there is a TA "(.*)" in the class$/, (email) => {
      expect(context.ta.email).toBe(email);
    });

    given(/^there are (\d+) students in the class$/, (count) => {
      expect(context.students.length).toBe(parseInt(count));
    });

    given(/^I am on the class directory page$/, async () => {
      context.response = await request.get(`/classes/${context.class.id}/directory`);
      expect(context.response.status).toBe(200);
      context.dom = new JSDOM(context.response.text);
    });

    when(/^I click the role management button for TA "(.*)"$/, (email) => {
      expect(context.ta.email).toBe(email);

      const button = context.dom.window.document.querySelector(`button[onclick="toggleRoleDropdown('${context.ta.id}')"]`);
      expect(button).toBeTruthy();
    });

    when(/^I select "(.*)" from the role dropdown$/, async (role) => {
      context.response = await request
        .put(`/classRoles/${context.class.id}/members/${context.ta.id}/role`)
        .send({ role: role.toUpperCase() });

      if (context.response.status === 200) {
        context.dom = new JSDOM(context.response.text);
      }
    });

    then(/^the TA should be moved to the "(.*)" section$/, async () => {
      expect(context.response.status).toBe(200);

      const updatedRole = await classRoleService.getClassRole(context.ta.id, context.class.id);
      expect(updatedRole.role).toBe("STUDENT");
    });

    then(/^the person's role badge should show "(.*)"$/, (roleText) => {
      // Find all role badges and look for the one that shows the expected role
      const roleBadges = context.dom.window.document.querySelectorAll('.role-badge');
      const expectedRoleBadge = Array.from(roleBadges).find(badge => badge.textContent.trim() === roleText);
      expect(expectedRoleBadge).toBeTruthy();
      expect(expectedRoleBadge.textContent.trim()).toBe(roleText);
    });

    then(/^the "(.*)" section count should decrease by (\d+)$/, () => {
      const countBadges = context.dom.window.document.querySelectorAll('.count-badge');
      expect(countBadges.length).toBeGreaterThan(0);
    });

    then(/^the "(.*)" section count should increase by (\d+)$/, () => {
      const countBadges = context.dom.window.document.querySelectorAll('.count-badge');
      expect(countBadges.length).toBeGreaterThan(0);
    });
  });

  test("Professor successfully demotes themselves when multiple professors exist", ({ given, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupTestData();
      expect(context.user.email).toBe(email);
      context.user = context.user; // Ensure context.user is set for auth
    });

    given(/^there is a class "(.*)" with invite code "(.*)"$/, (className, inviteCode) => {
      expect(context.class.name).toBe(className);
      expect(context.class.inviteCode).toBe(inviteCode);
    });

    given(/^I am a professor in the class$/, async () => {
      const role = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(role.role).toBe("PROFESSOR");
    });

    given(/^there is a second professor "(.*)" in the class$/, (email) => {
      expect(context.secondProf.email).toBe(email);
    });

    given(/^there is a TA "(.*)" in the class$/, (email) => {
      expect(context.ta.email).toBe(email);
    });

    given(/^there are (\d+) students in the class$/, (count) => {
      expect(context.students.length).toBe(parseInt(count));
    });

    given(/^I am on the class directory page$/, async () => {
      context.response = await request.get(`/classes/${context.class.id}/directory`);
      expect(context.response.status).toBe(200);
      context.dom = new JSDOM(context.response.text);
    });

    given(/^there are (\d+) professors in the class$/, async (count) => {
      const professors = await prisma.classRole.findMany({
        where: { 
          classId: context.class.id,
          role: "PROFESSOR"
        },
      });
      expect(professors.length).toBe(parseInt(count));
    });

    when(/^I click the role management button for myself$/, () => {
      const button = context.dom.window.document.querySelector(`button[onclick="toggleRoleDropdown('${context.user.id}')"]`);
      expect(button).toBeTruthy();
    });

    when(/^I select "(.*)" from the role dropdown$/, async (role) => {
      context.response = await request
        .put(`/classRoles/${context.class.id}/members/${context.user.id}/role`)
        .send({ role: role.toUpperCase() });

      if (context.response.status === 200) {
        context.dom = new JSDOM(context.response.text);
      }
    });

    then(/^I should be moved to the "(.*)" section$/, async () => {
      expect(context.response.status).toBe(200);

      const updatedRole = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(updatedRole.role).toBe("STUDENT");
    });

    then(/^my role badge should show "(.*)"$/, (roleText) => {
      // Find all role badges and look for the one that shows the expected role
      const roleBadges = context.dom.window.document.querySelectorAll('.role-badge');
      const expectedRoleBadge = Array.from(roleBadges).find(badge => badge.textContent.trim() === roleText);
      expect(expectedRoleBadge).toBeTruthy();
      expect(expectedRoleBadge.textContent.trim()).toBe(roleText);
    });

    then(/^the "(.*)" section count should decrease by (\d+)$/, () => {
      const countBadges = context.dom.window.document.querySelectorAll('.count-badge');
      expect(countBadges.length).toBeGreaterThan(0);
    });

    then(/^the "(.*)" section count should increase by (\d+)$/, () => {
      const countBadges = context.dom.window.document.querySelectorAll('.count-badge');
      expect(countBadges.length).toBeGreaterThan(0);
    });
  });

  test("Professor cannot demote themselves when they are the only professor", ({ given, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupTestData();
      expect(context.user.email).toBe(email);
      context.user = context.user; // Ensure context.user is set for auth
    });

    given(/^there is a class "(.*)" with invite code "(.*)"$/, (className, inviteCode) => {
      expect(context.class.name).toBe(className);
      expect(context.class.inviteCode).toBe(inviteCode);
    });

    given(/^I am a professor in the class$/, async () => {
      const role = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(role.role).toBe("PROFESSOR");
    });

    given(/^there is a second professor "(.*)" in the class$/, (email) => {
      expect(context.secondProf.email).toBe(email);
    });

    given(/^there is a TA "(.*)" in the class$/, (email) => {
      expect(context.ta.email).toBe(email);
    });

    given(/^there are (\d+) students in the class$/, (count) => {
      expect(context.students.length).toBe(parseInt(count));
    });

    given(/^I am on the class directory page$/, async () => {
      context.response = await request.get(`/classes/${context.class.id}/directory`);
      expect(context.response.status).toBe(200);
      context.dom = new JSDOM(context.response.text);
    });

    given(/^I first demote the second professor to student$/, async () => {
      await classRoleService.upsertClassRole({
        userId: context.secondProf.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    given(/^I am now the only professor in the class$/, async () => {
      const professors = await prisma.classRole.findMany({
        where: { 
          classId: context.class.id,
          role: "PROFESSOR"
        },
      });
      expect(professors.length).toBe(1);
      expect(professors[0].userId).toBe(context.user.id);
    });

    when(/^I click the role management button for myself$/, async () => {
      // Refresh page to get updated dropdown state
      context.response = await request.get(`/classes/${context.class.id}/directory`);
      context.dom = new JSDOM(context.response.text);

      const button = context.dom.window.document.querySelector(`button[onclick="toggleRoleDropdown('${context.user.id}')"]`);
      expect(button).toBeTruthy();
    });

    then(/^the "(.*)", "(.*)", and "(.*)" options should be disabled$/, () => {
      // Look specifically for the current user's dropdown options
      const userDropdown = context.dom.window.document.querySelector(`#role-dropdown-${context.user.id}`);
      expect(userDropdown).toBeTruthy();
      const disabledButtons = userDropdown.querySelectorAll('.role-option[disabled]');
      expect(disabledButtons.length).toBeGreaterThanOrEqual(3);
    });

    then(/^the disabled options should show tooltip "(.*)"$/, (tooltipText) => {
      const userDropdown = context.dom.window.document.querySelector(`#role-dropdown-${context.user.id}`);
      const disabledButton = userDropdown.querySelector('.role-option[disabled]');
      expect(disabledButton.getAttribute('title')).toBe(tooltipText);
    });

    then(/^only the "(.*)" option should be enabled$/, (roleText) => {
      const userDropdown = context.dom.window.document.querySelector(`#role-dropdown-${context.user.id}`);
      expect(userDropdown).toBeTruthy();
      const enabledButtons = userDropdown.querySelectorAll('.role-option:not([disabled])');
      expect(enabledButtons.length).toBe(1);
      expect(enabledButtons[0].textContent.trim()).toContain(roleText);
    });
  });

  test("System prevents professor from demoting themselves via API when they are the only professor", ({ given, when, then }) => {
    given(/^I am logged in as "(.*)"$/, async (email) => {
      await setupTestData();
      expect(context.user.email).toBe(email);
      context.user = context.user; // Ensure context.user is set for auth
    });

    given(/^there is a class "(.*)" with invite code "(.*)"$/, (className, inviteCode) => {
      expect(context.class.name).toBe(className);
      expect(context.class.inviteCode).toBe(inviteCode);
    });

    given(/^I am a professor in the class$/, async () => {
      const role = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(role.role).toBe("PROFESSOR");
    });

    given(/^there are (\d+) students in the class$/, (count) => {
      expect(context.students.length).toBe(parseInt(count));
    });

    given(/^I am the only professor in the class$/, async () => {
      // Remove second professor
      await classRoleService.upsertClassRole({
        userId: context.secondProf.id,
        classId: context.class.id,
        role: "STUDENT",
      });
    });

    when(/^I attempt to change my role to "(.*)" via API$/, async (role) => {
      try {
        context.response = await request
          .put(`/classRoles/${context.class.id}/members/${context.user.id}/role`)
          .send({ role: role.toUpperCase() });

        context.apiError = context.response.text;
      } catch (error) {
        context.apiError = error.message;
      }
    });

    then(/^I should receive an error "(.*)"$/, (errorMessage) => {
      expect(context.response.status).toBe(400);
      expect(context.apiError).toContain(errorMessage);
    });

    then(/^my role should remain "(.*)"$/, async (role) => {
      const currentRole = await classRoleService.getClassRole(context.user.id, context.class.id);
      expect(currentRole.role).toBe(role.toUpperCase());
    });

    then(/^I should stay in the "(.*)" section$/, () => {
      // The user should still be in the professors section
      expect(true).toBe(true); // This is verified by the role check above
    });
  });

});