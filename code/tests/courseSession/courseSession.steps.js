// code/tests/courseSession/courseSession.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import * as courseSessionService from "../../src/services/courseSession.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/courseSession.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.klass = undefined;
    context.response = undefined;
    context.user = undefined;
    context.students = undefined;
    context.group = undefined;
    context.session = undefined;
    context.sessions = undefined;
  });

  test("Create a new course session as Professor", ({
    given,
    when,
    then,
    and,
  }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      // Ensure request is authenticated as a professor
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });

      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    when(/^the professor starts a course session$/, async () => {
      const token = generateToken(context.user);
      const sessionData = {
        classId: context.klass.id,
        name: "Session 1",
        date: "2025-01-20",
        startTime: "09:00",
        endTime: "10:00",
      };
      context.response = await request
        .post(`/course-sessions`)
        .send(sessionData)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^a course session has been made$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body).toHaveProperty("id");
      expect(context.response.body.classId).toBe(context.klass.id);
    });
  });

  test("Non-authenticated user cannot create a course session", ({
    given,
    when,
    then,
  }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    when(
      /^a user tries to start a course session without authentication$/,
      async () => {
        const sessionData = {
          classId: context.klass.id,
          name: "Session 1",
          date: "2025-01-20",
          startTime: "09:00",
          endTime: "10:00",
        };
        context.response = await request
          .post(`/course-sessions`)
          .send(sessionData);
      },
    );

    then(/^the request should be rejected and redirect$/, () => {
      expect(context.response.status).toBe(302);
    });
  });

  test("Non-professor user cannot create a course session", ({
    given,
    when,
    then,
    and,
  }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class has a student user$/, async () => {
      context.user = await prisma.user.create({
        data: {
          email: "student@ucsd.edu",
          name: "Student User",
          isProf: false,
        },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
    });

    when(/^the student tries to start a course session$/, async () => {
      const token = generateToken(context.user);
      const sessionData = {
        classId: context.klass.id,
        name: "Session 1",
        date: "2025-01-20",
        startTime: "09:00",
        endTime: "10:00",
      };
      context.response = await request
        .post(`/course-sessions`)
        .set("Cookie", `auth_token=${token}`)
        .send(sessionData);
    });

    then(/^the request should be rejected with status 403$/, () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("Create session via HTMX request", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    when(
      /^the professor sends a course session request with HX header$/,
      async () => {
        const token = generateToken(context.user);
        const sessionData = {
          classId: context.klass.id,
          name: "Session HX",
          date: "2025-01-20",
          startTime: "09:00",
          endTime: "10:00",
        };
        context.response = await request
          .post(`/course-sessions`)
          .set("Cookie", `auth_token=${token}`)
          .set("hx-request", "true")
          .send(sessionData);
      },
    );

    then(
      /^the response status should be 200 and HX-Redirect should be set$/,
      () => {
        expect(context.response.status).toBe(200);
        expect(context.response.header).toHaveProperty(
          "hx-redirect",
          "/attendance",
        );
      },
    );
  });

  test("Retrieve an existing course session", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    and(/^a course session exists for that class$/, async () => {
      const token = generateToken(context.user);
      const sessionData = {
        classId: context.klass.id,
        name: "Session HX",
        date: "2025-01-20",
        startTime: "09:00",
        endTime: "10:00",
      };
      const postResponse = await request
        .post(`/course-sessions`)
        .set("Cookie", `auth_token=${token}`)
        .send(sessionData);

      context.session = postResponse.body;
    });

    when(/^the professor requests the course session by ID$/, async () => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/course-sessions/${context.session.id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^the session data should be returned with status 200$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toHaveProperty("id", context.session.id);
      expect(context.response.body).toHaveProperty("classId", context.klass.id);
    });
  });

  test("Retrieve a non-existent course session", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    when(/^a user requests a course session with a random ID$/, async () => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/course-sessions/nonexistent123`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^the request should be rejected with status 404$/, () => {
      expect(context.response.status).toBe(404);
    });
  });

  test("Retrieve all sessions for a class", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });

      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    and(/^multiple course sessions exist for that class$/, async () => {
      const token = generateToken(context.user);

      const sessionsData = [
        {
          classId: context.klass.id,
          name: "Session 1",
          date: "2025-01-20",
          startTime: "09:00",
          endTime: "10:00",
        },
        {
          classId: context.klass.id,
          name: "Session 2",
          date: "2025-01-21",
          startTime: "11:00",
          endTime: "12:00",
        },
      ];

      context.sessions = [];
      for (const s of sessionsData) {
        const response = await request
          .post(`/course-sessions`)
          .set("Cookie", `auth_token=${token}`)
          .send(s);
        context.sessions.push(response.body);
      }
    });

    when(/^the professor requests all sessions for the class$/, async () => {
      const token = generateToken(context.user);
      context.response = await request
        .get(`/course-sessions/class/${context.klass.id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(
      /^all sessions for the class should be returned with status 200$/,
      () => {
        expect(context.response.status).toBe(200);
        expect(Array.isArray(context.response.body)).toBe(true);
        expect(context.response.body.length).toBe(context.sessions.length);

        const returnedNames = context.response.body.map((s) => s.name).sort();
        const expectedNames = context.sessions.map((s) => s.name).sort();
        expect(returnedNames).toEqual(expectedNames);
      },
    );
  });

  test("Retrieve today's sessions for a class", ({
    given,
    when,
    then,
    and,
  }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    and(/^a course session exists for today$/, async () => {
      const token = generateToken(context.user);

      const today = new Date();
      const startTime = new Date(today);
      startTime.setHours(9, 0, 0, 0);

      const endTime = new Date(today);
      endTime.setHours(10, 0, 0, 0);

      const sessionData = {
        classId: context.klass.id,
        name: "Today's Session",
        date: today,
        startTime: startTime,
        endTime: endTime,
      };

      // Create the session
      context.session = await request
        .post(`/course-sessions`)
        .set("Cookie", `auth_token=${token}`)
        .send(sessionData);
    });

    when(
      /^the professor requests today's sessions for the class$/,
      async () => {
        const token = generateToken(context.user);
        context.response = await request
          .get(`/course-sessions/class/${context.klass.id}/today`)
          .set("Cookie", `auth_token=${token}`);
      },
    );

    then(/^the response should include today's session$/, () => {
      expect(context.response.status).toBe(200);
      expect(Array.isArray(context.response.body)).toBe(true);
      const sessionIds = context.response.body.map((s) => s.id);
      expect(sessionIds).toContain(context.session.body.id);
    });
  });

  test("Update an existing course session", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    and(/^a course session exists for that class$/, async () => {
      const token = generateToken(context.user);

      const sessionData = {
        classId: context.klass.id,
        name: "Session",
        date: "2025-01-20",
        startTime: "09:00",
        endTime: "10:00",
      };

      context.session = await request
        .post("/course-sessions")
        .set("Cookie", `auth_token=${token}`)
        .send(sessionData);
    });

    when(
      /^the professor updates the session name to "(.*)"$/,
      async (newName) => {
        const token = generateToken(context.user);

        context.updatedResponse = await request
          .put(`/course-sessions/${context.session.body.id}`)
          .set("Cookie", `auth_token=${token}`)
          .send({ name: newName });
      },
    );

    then(/^the session should have the updated name "(.*)"$/, (newName) => {
      expect(context.updatedResponse.status).toBe(200);
      expect(context.updatedResponse.body).toHaveProperty(
        "id",
        context.session.body.id,
      );
      expect(context.updatedResponse.body).toHaveProperty("name", newName);
    });
  });

  test("Delete an existing course session", ({ given, when, then, and }) => {
    given(/^a class named "(.*)" for "(.*)" exists$/, async (name, quarter) => {
      context.klass = await classService.createClass({ name, quarter });
    });

    and(/^the class is taught by a professor$/, async () => {
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      await classRoleService.upsertClassRole({
        userId: context.user.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    and(/^a course session exists for that class$/, async () => {
      const token = generateToken(context.user);

      const sessionData = {
        classId: context.klass.id,
        name: "Session",
        date: "2025-01-20",
        startTime: "09:00",
        endTime: "10:00",
      };

      context.session = await request
        .post("/course-sessions")
        .set("Cookie", `auth_token=${token}`)
        .send(sessionData);
    });

    when(/^the professor deletes the course session$/, async () => {
      const token = generateToken(context.user);

      context.deleteResponse = await request
        .delete(`/course-sessions/${context.session.body.id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^the session should be deleted successfully$/, async () => {
      expect(context.deleteResponse.status).toBe(204);

      // Verify that the session no longer exists in the DB
      const deletedSession = await prisma.courseSession.findUnique({
        where: { id: context.session.body.id },
      });
      expect(deletedSession).toBeNull();
    });
  });
});
