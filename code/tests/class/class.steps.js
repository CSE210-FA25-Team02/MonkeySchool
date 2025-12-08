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
  });

  test("Create a new class as Professor", ({ when, then, and }) => {
    when(/^I create a class named "(.*)" for "(.*)"$/, async (name, quarter) => {
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
    });

    then(/^a class named "(.*)" for "(.*)" should exist$/, async (name, quarter) => {
      const klass = await prisma.class.findFirst({ where: { name } });
      expect(klass).not.toBeNull();
    });

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
      context.klass = await classService.createClass({ name, quarter});
      await classRoleService.upsertClassRole({ 
        userId: context.user.id, 
        classId: context.klass.id, 
        role: "PROFESSOR", 
      });
    });

    when(/^I rename the class "(.*)" to "(.*)" for "(.*)"$/, async (_, newName, quarter) => {
      const token = generateToken(context.user);
      await request
        .put(`/classes/${context.klass.id}/${quarter}`)
        .set("Cookie", `auth_token=${token}`)
        .send({ name: newName });
    });

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
      context.klass = await classService.createClass({ name, quarter});
      await classRoleService.upsertClassRole({ 
        userId: context.user.id, 
        classId: context.klass.id, 
        role: "TA", 
      });
    });

    when(/^I rename the class "(.*)" to "(.*)" for "(.*)"$/, async (_, newName, quarter) => {
      const token = generateToken(context.user);
      await request
        .put(`/classes/${context.klass.id}/${quarter}`)
        .set("Cookie", `auth_token=${token}`)
        .send({ name: newName });
    });

    then(/^a class named "(.*)" should exist$/, async (newName) => {
      const klass = await prisma.class.findFirst({ where: { name: newName } });
      expect(klass).not.toBeNull();
    });
  });

  test("Fail to update class name as Student", ({ given, when, then }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "student@ucsd.edu", name: "Student User", isProf: false },
      });
      context.klass = await classService.createClass({ name, quarter});
      await classRoleService.upsertClassRole({ 
        userId: context.user.id, 
        classId: context.klass.id, 
        role: "STUDENT", 
      });
    });

    when(/^I rename the class "(.*)" to "(.*)" for "(.*)"$/, async (_, newName, quarter) => {
      const token = generateToken(context.user);
      context.response = await request
        .put(`/classes/${context.klass.id}/${quarter}`)
        .set("Cookie", `auth_token=${token}`)
        .send({ name: newName });
    });

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
        data: { email: "student@ucsd.edu", name: "Student User", isProf: false },
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
      expect(context.response.text).toContain(`<h2 style="margin-bottom: 8px;">Welcome to ${name}!</h2>`);
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

    when(/^I request to join a class with an invalid invite code$/, async () => {
      const token = generateToken(context.user);
      const inviteCode = 9999;
      context.response = await request
        .get(`/invite/${inviteCode}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^I should recieve an invalid invite$/, async () => {
      expect(context.response.status).toBe(404);
      expect(context.response.text).toContain('<h2 style="margin-bottom: 8px;">Invalid Invite Code</h2>');
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
      }
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
      }
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
      }
    );
  });
});
