import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as userService from "../../src/services/user.service.js";
import * as classService from "../../src/services/class.service.js";
import { generateToken } from "../../src/services/auth.service.js";

  const feature = loadFeature("./features/classRole.feature");

  defineFeature(feature, (test) => {
    beforeEach(async () => {
      await resetDatabase();
      // Reset context
      context.user = undefined;
      context.klass = undefined;
      context.professor = undefined;
      context.ta = undefined;
      context.students = [];
      context.response = undefined;
      context.error = undefined;
    });

    // =====================================================
    // GET ROSTER FUNCTIONALITY TESTS
    // =====================================================

    test("Get class roster as a professor", ({ given, when, then, and }) => {
      given(/^a class named "(.*)" exists$/, async (className) => {
        context.klass = await classService.createClass({ name: className });
      });

      given(/^the following users are in the class:$/, async (table) => {
        context.users = [];
        for (const row of table) {
          const user = await userService.createUser({
            name: row.name,
            email: row.email
          });

          await prisma.classRole.create({
            data: {
              userId: user.id,
              classId: context.klass.id,
              role: row.role.toUpperCase(),
            },
          });

          context.users.push({ ...user, role: row.role.toUpperCase() });

          // Set professor for authentication
          if (row.role.toUpperCase() === 'PROFESSOR') {
            context.professor = user;
          }
        }
      });

      when("I request the class roster", async () => {
        context.response = await request
          .get(`/api/classRoles/${context.klass.id}/roster`)
          .set('Authorization', `Bearer ${context.professor ? generateToken(context.professor) : 'mock-token'}`);
      });

      then("the response should be successful", () => {
        expect(context.response.status).toBe(200);
      });

      and("the roster should contain all class members", () => {
        const { data } = context.response.body;
        expect(data).toHaveLength(context.users.length);

        // Verify each user is in the roster
        context.users.forEach(user => {
          const rosterEntry = data.find(entry => entry.user.email === user.email);
          expect(rosterEntry).toBeDefined();
          expect(rosterEntry.role).toBe(user.role);
        });
      });
    });

    test("Get roster for non-existent class", ({ given, when, then }) => {
      given("a non-existent class ID", () => {
        context.nonExistentClassId = "clmnon1existent2classid3";
      });

      when("I request the roster for the non-existent class", async () => {
        context.response = await request
          .get(`/api/classRoles/${context.nonExistentClassId}/roster`)
          .set('Authorization', 'Bearer mock-professor-token');
      });

      then("the response should be not found", () => {
        expect(context.response.status).toBe(404);
      });
    });

    // =====================================================
    // UPDATE USER ROLE FUNCTIONALITY TESTS
    // =====================================================

    test("Professor assigns a role to a user", ({ given, when, then, and }) => {
      given(/^a professor "(.*)" exists in class "(.*)"$/, async (email, className) => {
        context.professor = await userService.createUser({
          name: "Professor",
          email
        });
        context.klass = await classService.createClass({ name: className });

        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      });

      given(/^a user "(.*)" exists$/, async (email) => {
        context.user = await userService.createUser({
          name: "User",
          email
        });
      });

      when(/^the professor assigns "(.*)" role to the user$/, async (role) => {
        context.response = await request
          .put(`/api/classRoles/${context.klass.id}/roster/${context.user.id}/assign`)
          .set('Authorization', `Bearer ${generateToken(context.professor)}`)
          .send({ role: role.toUpperCase() });
      });

      then("the assignment should be successful", () => {
        expect(context.response.status).toBe(200);
      });

      and(/^the user should have "(.*)" role in the class$/, async (role) => {
        const classRole = await prisma.classRole.findUnique({
          where: {
            user_class_unique: {
              userId: context.user.id,
              classId: context.klass.id,
            },
          },
        });
        expect(classRole.role).toBe(role.toUpperCase());
      });
    });

    test("Professor changes a user's role", ({ given, when, then, and }) => {
      given(/^a user "(.*)" with role "(.*)" exists in class "(.*)"$/, async (email, role, className) => {
        context.professor = await userService.createUser({
          name: "Professor",
          email: "prof@test.com"
        });
        context.user = await userService.createUser({
          name: "User",
          email
        });
        context.klass = await classService.createClass({ name: className });

        // Create professor role
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });

        // Create user role
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: role.toUpperCase(),
          },
        });
      });

      when(/^the professor changes the user's role to "(.*)"$/, async (newRole) => {
        context.response = await request
          .put(`/api/classRoles/${context.klass.id}/roster/${context.user.id}/assign`)
          .set('Authorization', `Bearer ${generateToken(context.professor)}`)
          .send({ role: newRole.toUpperCase() });
      });

      then("the role change should be successful", () => {
        expect(context.response.status).toBe(200);
      });

      and(/^the user should now have "(.*)" role$/, async (newRole) => {
        const classRole = await prisma.classRole.findUnique({
          where: {
            user_class_unique: {
              userId: context.user.id,
              classId: context.klass.id,
            },
          },
        });
        expect(classRole.role).toBe(newRole.toUpperCase());
      });
    });

    test("Non-professor cannot assign roles", ({ given, when, then }) => {
      given(/^a student "(.*)" exists in class "(.*)"$/, async (email, className) => {
        context.user = await userService.createUser({
          name: "Student",
          email
        });
        context.klass = await classService.createClass({ name: className });

        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      });

      given(/^another user "(.*)" exists$/, async (email) => {
        context.targetUser = await userService.createUser({
          name: "Target",
          email
        });
      });

      when(/^the student tries to assign "(.*)" role to the other user$/, async (role) => {
        context.response = await request
          .put(`/api/classRoles/${context.klass.id}/roster/${context.targetUser.id}/assign`)
          .set('Authorization', `Bearer ${generateToken(context.user)}`)
          .send({ role: role.toUpperCase() });
      });

      then("the request should be forbidden", () => {
        expect(context.response.status).toBe(403);
      });
    });

    // =====================================================
    // REMOVE USER FUNCTIONALITY TESTS
    // =====================================================

    test("Professor removes a user from class", ({ given, when, then, and }) => {
      given(/^a professor "(.*)" and student "(.*)" exist in class "(.*)"$/, async (profEmail, studentEmail, className) => {
        context.professor = await userService.createUser({
          name: "Professor",
          email: profEmail
        });
        context.student = await userService.createUser({
          name: "Student",
          email: studentEmail
        });
        context.klass = await classService.createClass({ name: className });

        // Create roles
        await prisma.classRole.createMany({
          data: [
            {
              userId: context.professor.id,
              classId: context.klass.id,
              role: "PROFESSOR",
            },
            {
              userId: context.student.id,
              classId: context.klass.id,
              role: "STUDENT",
            }
          ]
        });
      });

      when("the professor removes the student from the class", async () => {
        context.response = await request
          .delete(`/api/classRoles/${context.klass.id}/roster/${context.student.id}/remove`)
          .set('Authorization', `Bearer ${generateToken(context.professor)}`);
      });

      then("the removal should be successful", () => {
        expect(context.response.status).toBe(200);
      });

      and("the student should no longer be in the class", async () => {
        const classRole = await prisma.classRole.findUnique({
          where: {
            user_class_unique: {
              userId: context.student.id,
              classId: context.klass.id,
            },
          },
        });
        expect(classRole).toBeNull();
      });
    });

    test("Cannot remove the last professor", ({ given, when, then }) => {
      given(/^only one professor "(.*)" exists in class "(.*)"$/, async (email, className) => {
        context.professor = await userService.createUser({
          name: "Professor",
          email
        });
        context.klass = await classService.createClass({ name: className });

        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      });

      when("someone tries to remove the professor", async () => {
        context.response = await request
          .delete(`/api/classRoles/${context.klass.id}/roster/${context.professor.id}/remove`)
          .set('Authorization', `Bearer ${generateToken(context.professor)}`);
      });

      then("the request should be rejected", () => {
        expect(context.response.status).toBe(422);
      });
    });

    // =====================================================
    // ERROR HANDLING AND EDGE CASES
    // =====================================================

    test("Handle non-existent user assignment", ({ given, when, then }) => {
      given(/^a professor "(.*)" exists in class "(.*)"$/, async (email, className) => {
        context.professor = await userService.createUser({
          name: "Professor",
          email
        });
        context.klass = await classService.createClass({ name: className });

        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      });

      when("the professor tries to assign a role to a non-existent user", async () => {
        context.response = await request
          .put(`/api/classRoles/${context.klass.id}/roster/clmnon2existent3userid4/assign`)
          .set('Authorization', `Bearer ${generateToken(context.professor)}`)
          .send({ role: "STUDENT" });
      });

      then("the request should be not found", () => {
        expect(context.response.status).toBe(404);
      });
    });

    test("Cannot assign invalid role", ({ given, when, then }) => {
      given(/^a professor "(.*)" exists in class "(.*)"$/, async (email, className) => {
        context.professor = await userService.createUser({
          name: "Professor",
          email
        });
        context.klass = await classService.createClass({ name: className });

        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      });

      given(/^a user "(.*)" exists$/, async (email) => {
        context.user = await userService.createUser({
          name: "User",
          email
        });
      });

      when(/^the professor tries to assign "(.*)" role to the user$/, async (invalidRole) => {
        context.response = await request
          .put(`/api/classRoles/${context.klass.id}/roster/${context.user.id}/assign`)
          .set('Authorization', `Bearer ${generateToken(context.professor)}`)
          .send({ role: invalidRole });
      });

      then("the request should be rejected", () => {
        expect(context.response.status).toBe(400);
      });
    });
  });