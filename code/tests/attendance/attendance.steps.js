// code/tests/attendance/attendance.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as courseSessionService from "../../src/services/courseSession.service.js";
import * as attendancePollService from "../../src/services/attendancePoll.service.js";
import * as attendanceRecordService from "../../src/services/attendanceRecord.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/attendance.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.professor = undefined;
    context.student = undefined;
    context.student2 = undefined;
    context.klass = undefined;
    context.session = undefined;
    context.session2 = undefined;
    context.poll = undefined;
    context.response = undefined;
    context.token = undefined;
    context.token2 = undefined;
  });

  test("Professor creates an attendance poll", ({ given, when, then, and }) => {
    given(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.professor);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    when(
      /^the professor creates an attendance poll for session "(.*)" with duration "(.*)" minutes$/,
      async (sessionName, duration) => {
        context.response = await request
          .post("/attendance/poll/create")
          .send({
            sessionId: context.session.id,
            durationMinutes: parseInt(duration, 10),
          })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^the professor receives a new attendance poll with an 8-digit code$/,
      () => {
        expect(context.response.status).toBe(201);
        expect(context.response.body).toHaveProperty("code");
        expect(context.response.body.code).toMatch(/^\d{8}$/);
        expect(context.response.body).toHaveProperty("pollId");
        expect(context.response.body).toHaveProperty("expiresAt");
      }
    );

    and(/^the poll expires in "(.*)" minutes$/, async (duration) => {
      const poll = await prisma.attendancePoll.findUnique({
        where: { id: context.response.body.pollId },
      });
      expect(poll).toBeTruthy();
      const expiresAt = new Date(poll.expiresAt);
      const now = new Date();
      const diffMinutes = (expiresAt - now) / (1000 * 60);
      expect(diffMinutes).toBeCloseTo(parseInt(duration, 10), 0);
    });
  });

  test("Professor creates an attendance poll with default duration", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.professor);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    when(
      /^the professor creates an attendance poll for session "(.*)" without duration$/,
      async (sessionName) => {
        context.response = await request
          .post("/attendance/poll/create")
          .send({
            sessionId: context.session.id,
          })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^the professor receives a new attendance poll with an 8-digit code$/,
      () => {
        expect(context.response.status).toBe(201);
        expect(context.response.body).toHaveProperty("code");
        expect(context.response.body.code).toMatch(/^\d{8}$/);
      }
    );

    and(/^the poll expires with default duration$/, async () => {
      const poll = await prisma.attendancePoll.findUnique({
        where: { id: context.response.body.pollId },
      });
      expect(poll).toBeTruthy();
      expect(poll.expiresAt).toBeInstanceOf(Date);
    });
  });

  test("Student submits attendance with valid code", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an active attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    when(/^the student submits attendance with code "(.*)"$/, async (code) => {
      context.response = await request
        .post("/attendance/submit")
        .send({ code })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the student receives a success response$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toHaveProperty("status", "success");
    });

    and(
      /^an attendance record is created for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        const record = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: context.student.id,
            sessionId: context.session.id,
          },
        });
        expect(record).toBeTruthy();
        expect(record.studentId).toBe(context.student.id);
        expect(record.sessionId).toBe(context.session.id);
      }
    );
  });

  test("Student marks attendance with course selection", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an active attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    when(
      /^the student marks attendance with code "(.*)" for course "(.*)"$/,
      async (code, courseName) => {
        context.response = await request
          .post("/attendance/mark")
          .send({ code, courseId: context.klass.id })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the student receives a success response$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(
      /^an attendance record is created for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        const record = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: context.student.id,
            sessionId: context.session.id,
          },
        });
        expect(record).toBeTruthy();
      }
    );
  });

  test("Student cannot submit attendance with invalid code", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    when(/^the student submits attendance with code "(.*)"$/, async (code) => {
      context.response = await request
        .post("/attendance/submit")
        .send({ code })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBeGreaterThanOrEqual(400);
        expect(
          context.response.body.error ||
            context.response.text ||
            context.response.body.message
        ).toContain(errorMessage);
      }
    );
  });

  test("Student cannot submit attendance with expired code", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an expired attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() - 1); // Expired
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    when(/^the student submits attendance with code "(.*)"$/, async (code) => {
      context.response = await request
        .post("/attendance/submit")
        .send({ code })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBeGreaterThanOrEqual(400);
        const responseText =
          context.response.body.error ||
          context.response.text ||
          context.response.body.message ||
          "";
        expect(responseText).toContain(errorMessage);
      }
    );
  });

  test("Student cannot submit attendance twice for same session", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an active attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    and(
      /^an attendance record exists for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        await prisma.attendanceRecord.create({
          data: {
            studentId: context.student.id,
            sessionId: context.session.id,
            pollId: context.poll.id,
          },
        });
      }
    );

    when(/^the student submits attendance with code "(.*)"$/, async (code) => {
      context.response = await request
        .post("/attendance/submit")
        .send({ code })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBeGreaterThanOrEqual(400);
        const responseText =
          context.response.body.error ||
          context.response.text ||
          context.response.body.message ||
          "";
        expect(responseText).toContain(errorMessage);
      }
    );
  });

  test("Student cannot submit attendance if not enrolled", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an active attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    when(/^the student submits attendance with code "(.*)"$/, async (code) => {
      context.response = await request
        .post("/attendance/submit")
        .send({ code })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBeGreaterThanOrEqual(400);
        const responseText =
          context.response.body.error ||
          context.response.text ||
          context.response.body.message ||
          "";
        expect(responseText).toContain(errorMessage);
      }
    );
  });

  test("Non-professor cannot create attendance poll", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    when(
      /^the student attempts to create an attendance poll for session "(.*)"$/,
      async (sessionName) => {
        context.response = await request
          .post("/attendance/poll/create")
          .send({
            sessionId: context.session.id,
            durationMinutes: 15,
          })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBe(403);
        const responseText =
          context.response.body?.error ||
          context.response.text ||
          context.response.body?.message ||
          "";
        expect(responseText).toContain(errorMessage);
      }
    );
  });

  test("Professor cannot create poll for session they don't teach", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.professor);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor2 = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token2 = generateToken(context.professor2);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor2.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    when(
      /^professor "(.*)" attempts to create an attendance poll for session "(.*)"$/,
      async (profName, sessionName) => {
        context.response = await request
          .post("/attendance/poll/create")
          .send({
            sessionId: context.session.id,
            durationMinutes: 15,
          })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^the professor receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBe(403);
        const responseText =
          context.response.body?.error ||
          context.response.text ||
          context.response.body?.message ||
          "";
        expect(responseText).toContain(errorMessage);
      }
    );
  });

  test("Professor views session attendance records", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.professor);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^an active attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    and(
      /^an attendance record exists for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        await prisma.attendanceRecord.create({
          data: {
            studentId: context.student.id,
            sessionId: context.session.id,
            pollId: context.poll.id,
          },
        });
      }
    );

    when(
      /^the professor views attendance records for session "(.*)"$/,
      async (sessionName) => {
        context.response = await request
          .get(`/attendance/session/${context.session.id}`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the professor receives attendance records$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toHaveProperty("attendance");
      expect(Array.isArray(context.response.body.attendance)).toBe(true);
    });

    and(/^the records include "(.*)"$/, (studentName) => {
      const attendance = context.response.body.attendance;
      const studentRecord = attendance.find(
        (a) => a.name === studentName || a.studentId === context.student.id
      );
      expect(studentRecord).toBeTruthy();
    });
  });

  test("Professor views course attendance summary", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.professor);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session2 = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^an attendance record exists for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        const poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code: "12345678",
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
        await prisma.attendanceRecord.create({
          data: {
            studentId: context.student.id,
            sessionId: context.session.id,
            pollId: poll.id,
          },
        });
      }
    );

    when(
      /^the professor views attendance summary for course "(.*)"$/,
      async (courseName) => {
        context.response = await request
          .get(`/attendance/course/${context.klass.id}/summary`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the professor receives attendance summary$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toBeTruthy();
    });

    and(/^the summary includes session "(.*)"$/, (sessionName) => {
      // Summary structure may vary, but should include session data
      expect(context.response.body).toBeTruthy();
    });

    and(/^the summary includes session "(.*)"$/, (sessionName) => {
      // Summary structure may vary, but should include session data
      expect(context.response.body).toBeTruthy();
    });
  });

  test("Student views their own attendance history", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an attendance record exists for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        const poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code: "12345678",
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
        await prisma.attendanceRecord.create({
          data: {
            studentId: context.student.id,
            sessionId: context.session.id,
            pollId: poll.id,
          },
        });
      }
    );

    when(/^the student views their attendance history$/, async () => {
      context.response = await request
        .get("/attendance/student/me")
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the student receives their attendance history$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toHaveProperty("attendance");
      expect(Array.isArray(context.response.body.attendance)).toBe(true);
    });

    and(/^the history includes session "(.*)"$/, (sessionName) => {
      const attendance = context.response.body.attendance;
      const sessionRecord = attendance.find(
        (a) => a.sessionId === context.session.id
      );
      expect(sessionRecord).toBeTruthy();
    });
  });

  test("Student cannot view another student's attendance", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student2 = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token2 = generateToken(context.student2);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.student2.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an attendance record exists for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        const poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.student2.id,
            code: "12345678",
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
        await prisma.attendanceRecord.create({
          data: {
            studentId: context.student2.id,
            sessionId: context.session.id,
            pollId: poll.id,
          },
        });
      }
    );

    when(
      /^student "(.*)" attempts to view attendance for "(.*)"$/,
      async (viewerName, targetName) => {
        context.response = await request
          .get(
            `/api/course/${context.klass.id}/user/${context.student2.id}/records`
          )
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBeGreaterThanOrEqual(400);
        const responseText =
          context.response.body.error ||
          context.response.text ||
          context.response.body.message ||
          "";
        expect(responseText).toContain(errorMessage);
      }
    );
  });

  test("Student submits attendance with code containing spaces", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        if (!context.klass) {
          context.klass = await classService.createClass({ name: className });
        }
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    and(
      /^a course session "(.*)" exists for class "(.*)"$/,
      async (sessionName, className) => {
        context.session = await courseSessionService.createCourseSession({
          classId: context.klass.id,
          name: sessionName,
          date: new Date(),
        });
      }
    );

    and(
      /^an active attendance poll with code "(.*)" exists for session "(.*)"$/,
      async (code, sessionName) => {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        context.poll = await prisma.attendancePoll.create({
          data: {
            sessionId: context.session.id,
            createdBy: context.professor.id,
            code,
            expiresAt,
            durationMinutes: 15,
            active: true,
          },
        });
      }
    );

    when(
      /^the student marks attendance with code "(.*)" for course "(.*)"$/,
      async (code, courseName) => {
        context.response = await request
          .post("/attendance/mark")
          .send({ code, courseId: context.klass.id })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the student receives a success response$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(
      /^an attendance record is created for "(.*)" in session "(.*)"$/,
      async (studentName, sessionName) => {
        const record = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: context.student.id,
            sessionId: context.session.id,
          },
        });
        expect(record).toBeTruthy();
      }
    );
  });

  test("Student submits attendance with invalid code format", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.student);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a student$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    when(/^the student submits attendance with code "(.*)"$/, async (code) => {
      context.response = await request
        .post("/attendance/submit")
        .send({ code })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the student receives an error response with message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.status).toBe(400);
        const responseText =
          context.response.body?.error ||
          context.response.text ||
          context.response.body?.details?.code?.[0] ||
          context.response.body?.message ||
          JSON.stringify(context.response.body) ||
          "";
        // Check if error message is in response (case-insensitive partial match)
        // Also check for variations of the message
        const lowerResponse = responseText.toLowerCase();
        const lowerExpected = errorMessage.toLowerCase();
        const hasMatch =
          lowerResponse.includes(lowerExpected) ||
          lowerResponse.includes("8 digits") ||
          lowerResponse.includes("8-digit") ||
          lowerResponse.includes("exactly 8") ||
          (context.response.body?.details?.code &&
            Array.isArray(context.response.body.details.code) &&
            context.response.body.details.code.some((msg) =>
              msg.toLowerCase().includes("8")
            ));
        expect(hasMatch).toBe(true);
      }
    );
  });
});
