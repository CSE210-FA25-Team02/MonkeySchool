// code/tests/class/class.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/class.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.klass = undefined;
    context.response = undefined;
    context.user = undefined;
    context.students = undefined;
    context.group = undefined;
  });

  test("Create a new class as Professor", ({ when, then, and }) => {
    when(
      /^I create a class named "(.*)" for "(.*)"$/,
      async (name, quarter) => {
        // Ensure request is authenticated as a professor
        context.user = await prisma.user.create({
          data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
        });
        const token = generateToken(context.user);
        context.response = await request
          .post("/classes/create")
          .set("Cookie", `auth_token=${token}`)
          .send({ name, quarter });
        context.klass = context.response.body;
      },
    );

    then(
      /^a class named "(.*)" for "(.*)" should exist$/,
      async (name, quarter) => {
        const klass = await prisma.class.findFirst({ where: { name } });
        expect(klass).not.toBeNull();
      },
    );

    and("the class should have an auto-generated invite code", () => {
      expect(context.klass.inviteCode).toBeDefined();
      expect(context.klass.inviteCode.length).toBe(8);
    });
  });

  test("Update class name as Professor", ({ given, when, then }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      context.klass = await classService.createClass({ name, quarter });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    when(
      /^I rename the class "(.*)" to "(.*)" for "(.*)"$/,
      async (_, newName, quarter) => {
        const token = generateToken(context.user);
        await request
          .put(`/classes/${context.klass.id}/${quarter}`)
          .set("Cookie", `auth_token=${token}`)
          .send({ name: newName });
      },
    );

    then(/^a class named "(.*)" should exist$/, async (newName) => {
      const klass = await prisma.class.findFirst({ where: { name: newName } });
      expect(klass).not.toBeNull();
    });
  });

  test("Update class name as TA", ({ given, when, then }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "ta@ucsd.edu", name: "TA User", isProf: false },
      });
      context.klass = await classService.createClass({ name, quarter });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "TA",
      });
    });

    when(
      /^I rename the class "(.*)" to "(.*)" for "(.*)"$/,
      async (_, newName, quarter) => {
        const token = generateToken(context.user);
        await request
          .put(`/classes/${context.klass.id}/${quarter}`)
          .set("Cookie", `auth_token=${token}`)
          .send({ name: newName });
      },
    );

    then(/^a class named "(.*)" should exist$/, async (newName) => {
      const klass = await prisma.class.findFirst({ where: { name: newName } });
      expect(klass).not.toBeNull();
    });
  });

  test("Fail to update class name as Student", ({ given, when, then }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });
      context.klass = await classService.createClass({ name, quarter });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
    });

    when(
      /^I rename the class "(.*)" to "(.*)" for "(.*)"$/,
      async (_, newName, quarter) => {
        const token = generateToken(context.user);
        context.response = await request
          .put(`/classes/${context.klass.id}/${quarter}`)
          .set("Cookie", `auth_token=${token}`)
          .send({ name: newName });
      },
    );

    then(/^the request should be forbidden$/, async () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("Delete a class as Professor", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists for "(.*)"$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      context.klass = await classService.createClass({ name, quarter });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    when(/^I delete the class "(.*)" for "(.*)"$/, async (_, quarter) => {
      const token = generateToken(context.user);
      await request
        .delete(`/classes/${context.klass.id}/${quarter}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^no class named "(.*)" should exist for "(.*)"$/, async (name) => {
      const klass = await prisma.class.findFirst({ where: { name } });
      expect(klass).toBeNull();
    });
  });

  test("Fail to delete a class as TA", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists for "(.*)"$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "ta@ucsd.edu", name: "TA User", isProf: false },
      });
      context.klass = await classService.createClass({ name, quarter });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "TA",
      });
    });

    when(/^I delete the class "(.*)" for "(.*)"$/, async (_, quarter) => {
      const token = generateToken(context.user);
      context.response = await request
        .delete(`/classes/${context.klass.id}/${quarter}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^the request should be forbidden$/, async () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("Fail to delete a class as Student", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists for "(.*)"$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });
      context.klass = await classService.createClass({ name, quarter });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
    });

    when(/^I delete the class "(.*)" for "(.*)"$/, async (_, quarter) => {
      const token = generateToken(context.user);
      context.response = await request
        .delete(`/classes/${context.klass.id}/${quarter}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^the request should be forbidden$/, async () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("Get an existing class", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "professor@ucsd.edu",
          name: "Professor User",
          isProf: true,
        },
      });
      context.klass = await classService.createClass({ name });
    });

    when(/^I request the class ID for "(.*)"$/, async (name) => {
      context.response = await classService.getClassById(context.klass.id);
    });

    then(/^I should recieve a class called "(.*)"$/, async (name) => {
      expect(context.response.name).toBe(name);
    });
  });

  test("Get a non-existent class", ({ given, when, then }) => {
    given(/^no class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });
      await prisma.class.deleteMany({ where: { name } });
    });

    when(/^I request a class with ID (\d+)$/, async (id) => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/classes/${id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should not get a 404 Not Found response$/, async () => {
      expect(context.response.status).toBe(404);
    });
  });

  test("Join a class by invite", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });

      // Create a class
      context.klass = await classService.createClass({ name });
    });

    when(/^I request to join a class with its invite code$/, async () => {
      const token = generateToken(context.user);
      const inviteCode = context.klass.inviteCode;
      context.response = await request
        .get(`/invite/${inviteCode}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should be added to the class called "(.*)"$/, async (name) => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain(
        `<h2 style="margin-bottom: 8px;">Welcome to ${name}!</h2>`,
      );
    });
  });

  test("Fail to join a class by invite", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });

      // Create a class
      context.klass = await classService.createClass({ name });
    });

    when(
      /^I request to join a class with an invalid invite code$/,
      async () => {
        const token = generateToken(context.user);
        const inviteCode = 9999;
        context.response = await request
          .get(`/invite/${inviteCode}`)
          .set("Cookie", `auth_token=${token}`);
      },
    );

    then(/^I should recieve an invalid invite$/, async () => {
      expect(context.response.status).toBe(404);
      expect(context.response.text).toContain(
        '<h2 style="margin-bottom: 8px;">Invalid Invite Code</h2>',
      );
    });
  });

  test("Find a class by invite code", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });

      // Create a class
      context.klass = await classService.createClass({ name });
    });

    when(/^I request to find a class by its invite code$/, async () => {
      const token = generateToken(context.user);
      const inviteCode = context.klass.inviteCode;
      context.response = await request
        .get(`/classes/invite/${inviteCode}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should get the class called "(.*)"$/, async (name) => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.name).toBe(name);
    });
  });

  test("Get all classes for a user", ({ given, and, when, then }) => {
    given(/^a user "(.*)" with email "(.*)" exists$/, async (name, email) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: email, name: name, isProf: false },
      });
    });

    given(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        const klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: klass.id,
            role: "STUDENT",
          },
        });
        context.classes = context.classes || [];
        context.classes.push(klass);
      },
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        const klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: klass.id,
            role: "STUDENT",
          },
        });
        context.classes.push(klass);
      },
    );

    when(/^I request the classes for "(.*)"$/, async (name) => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/classes/user/classes`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(
      /^I should receive the classes "(.*)" and "(.*)"$/,
      async (className1, className2) => {
        expect(context.response.status).toBe(200);
        const classNames = context.response.body.map((c) => c.name);
        expect(classNames).toContain(className1);
        expect(classNames).toContain(className2);
      },
    );
  });



  test("Get class directory JSON", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists with members and groups$/, async (className) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });

      // Create a class
      context.klass = await classService.createClass({ name: className });

      // Assign professor role
      await prisma.classRole.create({
        data: {
          userId: context.user.id,
          classId: context.klass.id,
          role: "PROFESSOR",
        },
      });

      // Add some students
      context.students = [];
      for (let i = 0; i < 2; i++) {
        const student = await prisma.user.create({
          data: { email: `student${i}@ucsd.edu`, name: `Student ${i}` },
        });
        context.students.push(student);

        await prisma.classRole.create({
          data: {
            userId: student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }

      // Add a group with one student
      context.group = await prisma.group.create({
        data: {
          classId: context.klass.id,
          name: "Alpha Team",
          members: {
            create: {
              userId: context.students[0].id,
              role: "LEADER",
            },
          },
        },
        include: { members: true },
      });
    });

    when(/^I request the directory for the class$/, async () => {
      const token = generateToken(context.user);

      context.response = await request
        .get(`/classes/${context.klass.id}/directory/json`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should receive the organized class directory$/, async () => {
      expect(context.response.status).toBe(200);
      const data = context.response.body;

      // Check class info
      expect(data.class.id).toBe(context.klass.id);
      expect(data.class.name).toBe(context.klass.name);

      // Check professor
      expect(data.professors).toHaveLength(1);
      expect(data.professors[0].id).toBe(context.user.id);

      // Check students without group
      expect(data.studentsWithoutGroup).toHaveLength(1);
      expect(data.studentsWithoutGroup[0].id).toBe(context.students[1].id);

      // Check group members
      expect(data.groups).toHaveLength(1);
      const group = data.groups[0];
      expect(group.name).toBe("Alpha Team");
      expect(group.members).toHaveLength(1);
      expect(group.members[0].isLeader).toBe(true);
      expect(group.members[0].id).toBe(context.students[0].id);
    });
  });

  test("View classes as a full page", ({ given, when, then }) => {
    given(/^I am a user with classes exists$/, async () => {
      // Create a test user
      context.user = await prisma.user.create({
        data: { email: "student@ucsd.edu", name: "Student User", isProf: false },
      });

      // Create classes for the user
      context.classes = [];
      for (let i = 1; i <= 2; i++) {
        const klass = await classService.createClass({ name: `Class ${i}` });
        await prisma.classRole.create({
          data: {
            classId: klass.id,
            userId: context.user.id,
            role: "STUDENT",
          },
        });
        context.classes.push(klass);
      }
    });

    when(/^I request my classes as a normal page$/, async () => {
      const token = generateToken(context.user);

      context.response = await request
        .get("/classes/my-classes")
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should receive the full page HTML$/, async () => {
      expect(context.response.status).toBe(200);
      const html = context.response.text;

      // Should include the main page title
      expect(html).toContain("My Classes");

      // Should include all class names
      context.classes.forEach((klass) => {
        expect(html).toContain(klass.name);
      });

      // Should include the "Create / Join Class" button
      expect(html).toContain("Create / Join Class");
    });
  });

  test("View classes as a partial HTMX", ({ given, when, then }) => {
    given(/^a user with classes exists$/, async () => {
      // Create a test user
      context.user = await prisma.user.create({
        data: { email: "student@ucsd.edu", name: "Student User", isProf: false },
      });

      // Create classes for the user
      context.classes = [];
      for (let i = 1; i <= 2; i++) {
        const klass = await classService.createClass({ name: `Class ${i}` });
        await prisma.classRole.create({
          data: {
            classId: klass.id,
            userId: context.user.id,
            role: "STUDENT",
          },
        });
        context.classes.push(klass);
      }
    });

    when(/^I request my classes via HTMX$/, async () => {
      const token = generateToken(context.user);

      context.response = await request
        .get("/classes/user/classes")
        .set("Cookie", `auth_token=${token}`)
        .set("hx-request", "true"); // mark as HTMX request
    });

    then(/^I should receive the class list HTML$/, async () => {
      expect(context.response.status).toBe(200);
      const html = context.response.text;

      // Check for class names in the HTML
      context.classes.forEach((klass) => {
        expect(html).toContain(klass.name);
      });

      // Check that it does NOT include the full-page wrapper (like "My Classes" title)
      expect(html).not.toContain("My Classes");
    });
  });

  test("Render class page for a student", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await prisma.user.create({
        data: { email, name, isProf: false },
      });
    });

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^the user is enrolled in "(.*)" as "(.*)"$/, async (className, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.user.id,
          classId: context.klass.id,
          role,
        },
      });
    });

    when(/^I request the class page for "(.*)"$/, async (className) => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/classes/${context.klass.id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should receive the full page HTML$/, async () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("<!DOCTYPE html>");
    });

    and(/^the HTML should contain "(.*)"$/, async (text) => {
      expect(context.response.text).toContain(text);
    });

    and(/^the HTML should contain the pulse component$/, async () => {
      expect(context.response.text).toContain("id=\"pulse-check-container\"");
    });

    and(/^the HTML should contain the "Punch In" button$/, async () => {
      expect(context.response.text).toContain("id=\"class-punch-btn\"");
    });
  });

  test("Render class page for an instructor", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await prisma.user.create({
        data: { email, name, isProf: true },
      });
    });

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^the user is enrolled in "(.*)" as "(.*)"$/, async (className, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.user.id,
          classId: context.klass.id,
          role,
        },
      });
    });

    when(/^I request the class page for "(.*)"$/, async (className) => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/classes/${context.klass.id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should receive the full page HTML$/, async () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("<!DOCTYPE html>");
    });

    and(/^the HTML should contain "(.*)"$/, async (text) => {
      expect(context.response.text).toContain(text);
    });

    and(/^the HTML should NOT contain the pulse component$/, async () => {
      expect(context.response.text).not.toContain("id=\"pulse-check-container\"");
    });
  });

});
