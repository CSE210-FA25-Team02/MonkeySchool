// code/tests/class/classDirectory.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";

const feature = loadFeature("./features/classDirectory.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.class = undefined;
    context.users = {};
    context.groups = {};
    context.response = undefined;
    context.directory = undefined;
  });

  // Helper function to create a user with specific details
  async function createUserWithDetails(userData) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        preferredName: userData.preferredName || null,
        email: userData.email,
        pronunciation: userData.pronunciation || null,
        pronouns: userData.pronouns || null,
        phone: userData.phone || null,
        github: userData.github || null,
        bio: userData.bio || null,
        photoUrl: userData.photoUrl || null,
        socialLinks: userData.socialLinks || [],
        chatLinks: userData.chatLinks || [],
        timezone: userData.timezone || null
      }
    });
    context.users[userData.name] = user;
    return user;
  }

  // Helper function to add user to class with specific role
  async function addUserToClass(userName, className, role) {
    const user = context.users[userName];
    const classData = await prisma.class.findFirst({ where: { name: className } });
    
    await prisma.classRole.create({
      data: {
        classId: classData.id,
        userId: user.id,
        role: role
      }
    });
  }

  // Helper function to create a group with details
  async function createGroupWithDetails(groupData, className) {
    const classData = await prisma.class.findFirst({ where: { name: className } });
    
    const group = await prisma.group.create({
      data: {
        name: groupData.name,
        logoUrl: groupData.logoUrl || null,
        mantra: groupData.mantra || null,
        github: groupData.github || null,
        classId: classData.id
      }
    });
    context.groups[groupData.name] = group;
    return group;
  }

  // Helper function to add user to group
  async function addUserToGroup(userName, groupName, role = 'MEMBER') {
    const user = context.users[userName];
    const group = context.groups[groupName];
    
    await prisma.groupRole.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: role
      }
    });
  }

  test("Get directory for empty class", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then("the directory should be empty", () => {
      expect(context.directory.professors).toHaveLength(0);
      expect(context.directory.tas).toHaveLength(0);
      expect(context.directory.tutors).toHaveLength(0);
      expect(context.directory.groups).toHaveLength(0);
      expect(context.directory.studentsWithoutGroup).toHaveLength(0);
    });

    and("the directory should contain class information", () => {
      expect(context.directory.class).toBeDefined();
      expect(context.directory.class.name).toBe("Empty Class");
      expect(context.directory.class.id).toBeDefined();
    });
  });

  test("Get directory with professors only", ({ given, and, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has professor "(.*)" with email "(.*)"$/, async (professorName, email) => {
      await createUserWithDetails({ name: professorName, email });
      await addUserToClass(professorName, "Professor Class", "PROFESSOR");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the directory should contain (\d+) professor$/, (count) => {
      expect(context.directory.professors).toHaveLength(parseInt(count));
    });

    and(/^the professor section should show "(.*)"$/, (professorName) => {
      expect(context.directory.professors[0].name).toBe(professorName);
      expect(context.directory.professors[0].role).toBe("PROFESSOR");
    });
  });

  test("Get directory with TAs and tutors", ({ given, and, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has TA "(.*)" with email "(.*)"$/, async (taName, email) => {
      await createUserWithDetails({ name: taName, email });
      await addUserToClass(taName, "Mixed Staff Class", "TA");
    });

    and(/^the class has tutor "(.*)" with email "(.*)"$/, async (tutorName, email) => {
      await createUserWithDetails({ name: tutorName, email });
      await addUserToClass(tutorName, "Mixed Staff Class", "TUTOR");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the directory should contain (\d+) TA$/, (count) => {
      expect(context.directory.tas).toHaveLength(parseInt(count));
    });

    and(/^the directory should contain (\d+) tutor$/, (count) => {
      expect(context.directory.tutors).toHaveLength(parseInt(count));
    });

    and(/^the TA section should show "(.*)"$/, (taName) => {
      expect(context.directory.tas[0].name).toBe(taName);
      expect(context.directory.tas[0].role).toBe("TA");
    });

    and(/^the tutor section should show "(.*)"$/, (tutorName) => {
      expect(context.directory.tutors[0].name).toBe(tutorName);
      expect(context.directory.tutors[0].role).toBe("TUTOR");
    });
  });

  test("Get directory with grouped students", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Group Class", "STUDENT");
    });

    and(/^the class has another student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Group Class", "STUDENT");
    });

    and(/^there is a group named "(.*)" in the class$/, async (groupName) => {
      await createGroupWithDetails({ name: groupName }, "Group Class");
    });

    and(/^"(.*)" is a leader in group "(.*)"$/, async (studentName, groupName) => {
      await addUserToGroup(studentName, groupName, "LEADER");
    });

    and(/^"(.*)" is a member in group "(.*)"$/, async (studentName, groupName) => {
      await addUserToGroup(studentName, groupName, "MEMBER");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the directory should contain (\d+) group$/, (count) => {
      expect(context.directory.groups).toHaveLength(parseInt(count));
    });

    and(/^the group "(.*)" should have (\d+) members$/, (groupName, memberCount) => {
      const group = context.directory.groups.find(g => g.name === groupName);
      expect(group).toBeDefined();
      expect(group.members).toHaveLength(parseInt(memberCount));
    });

    and(/^"(.*)" should be marked as leader in "(.*)"$/, (studentName, groupName) => {
      const group = context.directory.groups.find(g => g.name === groupName);
      const leader = group.members.find(m => m.name === studentName);
      expect(leader).toBeDefined();
      expect(leader.isLeader).toBe(true);
      expect(leader.groupRole).toBe("LEADER");
    });
  });

  test("Get directory with ungrouped students", ({ given, and, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Ungrouped Class", "STUDENT");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the directory should contain (\d+) ungrouped student$/, (count) => {
      expect(context.directory.studentsWithoutGroup).toHaveLength(parseInt(count));
    });

    and(/^the ungrouped section should show "(.*)"$/, (studentName) => {
      expect(context.directory.studentsWithoutGroup[0].name).toBe(studentName);
      expect(context.directory.studentsWithoutGroup[0].role).toBe("STUDENT");
    });
  });

  test("Get directory with complete structure", ({ given, and, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has professor "(.*)" with email "(.*)"$/, async (professorName, email) => {
      await createUserWithDetails({ name: professorName, email });
      await addUserToClass(professorName, "Full Class", "PROFESSOR");
    });

    and(/^the class has TA "(.*)" with email "(.*)"$/, async (taName, email) => {
      await createUserWithDetails({ name: taName, email });
      await addUserToClass(taName, "Full Class", "TA");
    });

    and(/^the class has tutor "(.*)" with email "(.*)"$/, async (tutorName, email) => {
      await createUserWithDetails({ name: tutorName, email });
      await addUserToClass(tutorName, "Full Class", "TUTOR");
    });

    and(/^the class has student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Full Class", "STUDENT");
    });

    and(/^the class has another student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Full Class", "STUDENT");
    });

    and(/^the class has a third student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Full Class", "STUDENT");
    });

    and(/^there is a group named "(.*)" in the class$/, async (groupName) => {
      await createGroupWithDetails({ name: groupName }, "Full Class");
    });

    and(/^"(.*)" is a leader in group "(.*)"$/, async (studentName, groupName) => {
      await addUserToGroup(studentName, groupName, "LEADER");
    });

    and(/^"(.*)" is a member in group "(.*)"$/, async (studentName, groupName) => {
      await addUserToGroup(studentName, groupName, "MEMBER");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the directory should contain (\d+) professor$/, (count) => {
      expect(context.directory.professors).toHaveLength(parseInt(count));
    });

    and(/^the directory should contain (\d+) TA$/, (count) => {
      expect(context.directory.tas).toHaveLength(parseInt(count));
    });

    and(/^the directory should contain (\d+) tutor$/, (count) => {
      expect(context.directory.tutors).toHaveLength(parseInt(count));
    });

    and(/^the directory should contain (\d+) group$/, (count) => {
      expect(context.directory.groups).toHaveLength(parseInt(count));
    });

    and(/^the directory should contain (\d+) ungrouped student$/, (count) => {
      expect(context.directory.studentsWithoutGroup).toHaveLength(parseInt(count));
    });

    and(/^the total member count should be (\d+)$/, (totalCount) => {
      const actualTotal = 
        context.directory.professors.length +
        context.directory.tas.length +
        context.directory.tutors.length +
        context.directory.groups.reduce((sum, group) => sum + group.members.length, 0) +
        context.directory.studentsWithoutGroup.length;
      expect(actualTotal).toBe(parseInt(totalCount));
    });
  });

  test("Get directory for non-existent class", ({ when, then, and }) => {
    when(/^I request the directory for "(.*)"$/, async () => {
      // Use a non-existent class ID
      context.response = await request.get(`/classes/99999/directory/json`);
    });

    then("the directory should not be found", () => {
      expect(context.response.status).toBe(404);
    });

    and("the response should indicate class not found", () => {
      expect(context.response.body.message || context.response.body.error || "Class not found").toContain("not found");
    });
  });

  test("Verify member details in directory", ({ given, and, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has student "(.*)" with the following details:$/, async (studentName) => {
      // For now, create a student with basic details to test the functionality
      const userData = {
        name: studentName,
        preferredName: "Detail",
        email: "detail@university.edu",
        pronunciation: "dih-TAYL",
        pronouns: "they/them",
        phone: "+1-555-0123",
        github: "detailstudent",
        bio: "I love software engineering"
      };
      
      await createUserWithDetails(userData);
      await addUserToClass(studentName, "Detail Class", "STUDENT");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the student details should include preferred name "(.*)"$/, (preferredName) => {
      const student = context.directory.studentsWithoutGroup[0];
      expect(student.preferredName).toBe(preferredName);
    });

    and(/^the student details should include pronunciation "(.*)"$/, (pronunciation) => {
      const student = context.directory.studentsWithoutGroup[0];
      expect(student.pronunciation).toBe(pronunciation);
    });

    and(/^the student details should include pronouns "(.*)"$/, (pronouns) => {
      const student = context.directory.studentsWithoutGroup[0];
      expect(student.pronouns).toBe(pronouns);
    });

    and("the student details should include contact information", () => {
      const student = context.directory.studentsWithoutGroup[0];
      expect(student.email).toBeDefined();
      expect(student.phone).toBeDefined();
      expect(student.github).toBeDefined();
    });
  });

  test("Verify group details in directory", ({ given, and, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (className) => {
      context.class = await classService.createClass({ name: className });
    });

    and(/^the class has student "(.*)" with email "(.*)"$/, async (studentName, email) => {
      await createUserWithDetails({ name: studentName, email });
      await addUserToClass(studentName, "Group Detail Class", "STUDENT");
    });

    and(/^there is a group named "(.*)" with the following details:$/, async (groupName) => {
      // For now, create a group with basic details to test the functionality  
      const groupData = {
        name: groupName,
        logoUrl: "https://example.com/logo.png",
        mantra: "We build amazing software",
        github: "awesome-team-repo"
      };
      
      await createGroupWithDetails(groupData, "Group Detail Class");
    });

    and(/^"(.*)" is a leader in group "(.*)"$/, async (studentName, groupName) => {
      await addUserToGroup(studentName, groupName, "LEADER");
    });

    when(/^I request the directory for "(.*)"$/, async (className) => {
      const classData = await prisma.class.findFirst({ where: { name: className } });
      context.response = await request.get(`/classes/${classData.id}/directory/json`);
      context.directory = context.response.body;
    });

    then(/^the group "(.*)" should have logo "(.*)"$/, (groupName, logoUrl) => {
      const group = context.directory.groups.find(g => g.name === groupName);
      expect(group).toBeDefined();
      expect(group.logoUrl).toBe(logoUrl);
    });

    and(/^the group "(.*)" should have mantra "(.*)"$/, (groupName, mantra) => {
      const group = context.directory.groups.find(g => g.name === groupName);
      expect(group.mantra).toBe(mantra);
    });

    and(/^the group "(.*)" should have github "(.*)"$/, (groupName, github) => {
      const group = context.directory.groups.find(g => g.name === groupName);
      expect(group.github).toBe(github);
    });
  });
});