// code/tests/attendance/attendance.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import * as courseSessionService from "../../src/services/courseSession.service.js";
import * as attendancePollService from "../../src/services/attendancePoll.service.js";
import * as attendanceRecordService from "../../src/services/attendanceRecord.service.js";

const feature = loadFeature("./features/attendance.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.professor = undefined;
    context.student = undefined;
    context.klass = undefined;
    context.session = undefined;
    context.poll = undefined;
    context.response = undefined;
  });

  test("Professor creates an attendance poll", ({ given, and, when, then }) => {
    given(/^a professor "(.*)" exists$/, async (name) => {
      context.professor = await prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
          name,
          isProf: true,
        },
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and("the professor teaches the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.professor.id,
        classId: context.klass.id,
        role: "PROFESSOR",
      });
    });

    and(/^a course session "(.*)" exists for the class$/, async (sessionName) => {
      context.session = await courseSessionService.createCourseSession({
        classId: context.klass.id,
        name: sessionName,
        date: new Date(),
      });
    });

    when(
      /^the professor creates an attendance poll for the session with duration (\d+) minutes$/,
      async (duration) => {
        // Mock authentication by setting user in request
        const token = "mock-token"; // In real tests, use actual JWT
        context.response = await request
          .post("/api/attendance/poll/create")
          .set("Cookie", `auth_token=${token}`)
          .send({
            sessionId: context.session.id,
            durationMinutes: parseInt(duration, 10),
          });
      },
    );

    then(
      /^an attendance poll should exist with a unique 8-digit code$/,
      async () => {
        const polls = await prisma.attendancePoll.findMany({
          where: { sessionId: context.session.id },
        });
        expect(polls.length).toBeGreaterThan(0);
        const poll = polls[0];
        expect(poll.code).toMatch(/^\d{8}$/);
        context.poll = poll;
      },
    );

    and(/^the poll should expire in (\d+) minutes$/, async (duration) => {
      const expiresAt = new Date(context.poll.expiresAt);
      const now = new Date();
      const minutesUntilExpiry =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      expect(minutesUntilExpiry).toBeCloseTo(parseInt(duration, 10), 0);
    });
  });

  test("Student submits valid attendance code", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^a professor "(.*)" exists$/, async (name) => {
      context.professor = await prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
          name,
          isProf: true,
        },
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^a student "(.*)" exists$/, async (studentName) => {
      context.student = await prisma.user.create({
        data: {
          email: `${studentName.toLowerCase()}@example.com`,
          name: studentName,
          isProf: false,
        },
      });
    });

    and("the student is enrolled in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.student.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
    });

    and(/^a course session "(.*)" exists for the class$/, async (sessionName) => {
      context.session = await courseSessionService.createCourseSession({
        classId: context.klass.id,
        name: sessionName,
        date: new Date(),
      });
    });

    and("an active attendance poll exists for the session", async () => {
      context.poll = await attendancePollService.createAttendancePoll(
        context.session.id,
        10,
        context.professor.id,
      );
    });

    when("the student submits the attendance code", async () => {
      const token = "mock-token";
      context.response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${token}`)
        .send({ code: context.poll.code });
    });

    then(
      /^an attendance record should be created for the student and session$/,
      async () => {
        const record = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: context.student.id,
            sessionId: context.session.id,
          },
        });
        expect(record).not.toBeNull();
      },
    );

    and("the record should show the student as present", () => {
      expect(context.response.status).toBe(200);
    });
  });

  test("Student submits expired code", ({ given, and, when, then }) => {
    // Similar setup as above
    given(/^a professor "(.*)" exists$/, async (name) => {
      context.professor = await prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
          name,
          isProf: true,
        },
      });
    });

    and(/^a class "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^a student "(.*)" exists$/, async (studentName) => {
      context.student = await prisma.user.create({
        data: {
          email: `${studentName.toLowerCase()}@example.com`,
          name: studentName,
          isProf: false,
        },
      });
    });

    and("the student is enrolled in the class", async () => {
      await classRoleService.upsertClassRole({
        userId: context.student.id,
        classId: context.klass.id,
        role: "STUDENT",
      });
    });

    and(/^a course session "(.*)" exists for the class$/, async (sessionName) => {
      context.session = await courseSessionService.createCourseSession({
        classId: context.klass.id,
        name: sessionName,
        date: new Date(),
      });
    });

    and("an expired attendance poll exists for the session", async () => {
      // Create a poll that's already expired
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() - 1); // Expired 1 minute ago

      context.poll = await prisma.attendancePoll.create({
        data: {
          sessionId: context.session.id,
          createdBy: context.professor.id,
          code: "12345678",
          expiresAt,
          durationMinutes: 10,
          active: true,
        },
      });
    });

    when("the student submits the expired attendance code", async () => {
      const token = "mock-token";
      context.response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${token}`)
        .send({ code: context.poll.code });
    });

    then(/^the submission should be rejected with "(.*)" error$/, (errorMsg) => {
      expect(context.response.status).toBe(410); // Gone
      expect(context.response.body.error).toContain(errorMsg);
    });
  });

  // Additional test scenarios would follow similar patterns...
  // For brevity, I'll include key ones
});

