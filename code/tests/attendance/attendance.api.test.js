// code/tests/attendance/attendance.api.test.js

import { describe, it, expect, beforeEach } from "@jest/globals";
import { prisma } from "../../src/lib/prisma.js";
import { resetDatabase } from "../utils/reset-db.js";
import { request } from "../steps.config.js";
import { generateToken } from "../utils/auth.test.helper.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import * as courseSessionService from "../../src/services/courseSession.service.js";
import * as attendancePollService from "../../src/services/attendancePoll.service.js";
import * as attendanceRecordService from "../../src/services/attendanceRecord.service.js";

describe("Attendance API", () => {
  let professor, student, otherProfessor, klass, otherClass, session;

  beforeEach(async () => {
    await resetDatabase();

    // Create users
    professor = await prisma.user.create({
      data: { email: "prof@example.com", name: "Professor", isProf: true },
    });
    otherProfessor = await prisma.user.create({
      data: {
        email: "otherprof@example.com",
        name: "Other Professor",
        isProf: true,
      },
    });
    student = await prisma.user.create({
      data: { email: "student@example.com", name: "Student", isProf: false },
    });

    // Create classes
    klass = await classService.createClass({ name: "Test Class" });
    otherClass = await classService.createClass({ name: "Other Class" });

    // Enroll users
    await classRoleService.upsertClassRole({
      userId: professor.id,
      classId: klass.id,
      role: "PROFESSOR",
    });
    await classRoleService.upsertClassRole({
      userId: otherProfessor.id,
      classId: otherClass.id,
      role: "PROFESSOR",
    });
    await classRoleService.upsertClassRole({
      userId: student.id,
      classId: klass.id,
      role: "STUDENT",
    });

    // Create session
    session = await courseSessionService.createCourseSession({
      classId: klass.id,
      name: "Test Session",
      date: new Date(),
    });
  });

  describe("POST /api/attendance/poll/create", () => {
    it("should create a poll with valid session", async () => {
      const professorToken = generateToken(professor);
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${professorToken}`)
        .send({
          sessionId: session.id,
          durationMinutes: 15,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("pollId");
      expect(response.body).toHaveProperty("code");
      expect(response.body.code).toMatch(/^\d{8}$/);
    });

    it("should reject if not professor", async () => {
      const studentToken = generateToken(student);
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          sessionId: session.id,
          durationMinutes: 15,
        });

      expect(response.status).toBe(403);
    });

    it("should use default duration if not provided", async () => {
      const professorToken = generateToken(professor);
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${professorToken}`)
        .send({
          sessionId: session.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("code");
    });

    it("should reject if professor does not teach the class", async () => {
      const otherProfessorToken = generateToken(otherProfessor);
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${otherProfessorToken}`)
        .send({
          sessionId: session.id,
          durationMinutes: 15,
        });

      expect(response.status).toBe(403);
    });

    it("should reject with non-existent sessionId", async () => {
      const professorToken = generateToken(professor);
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${professorToken}`)
        .send({
          sessionId: "non-existent-session-id",
          durationMinutes: 15,
        });

      expect(response.status).toBe(404);
    });

    it("should reject with invalid durationMinutes", async () => {
      const professorToken = generateToken(professor);
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${professorToken}`)
        .send({
          sessionId: session.id,
          durationMinutes: "invalid-duration",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/attendance/submit", () => {
    let poll;

    beforeEach(async () => {
      poll = await attendancePollService.createAttendancePoll(
        session.id,
        10,
        professor.id,
      );
    });

    it("should submit attendance with valid code", async () => {
      const studentToken = generateToken(student);
      const response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          code: poll.code,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "success");
    });

    it("should reject invalid code", async () => {
      const studentToken = generateToken(student);
      const response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          code: "99999999",
        });

      expect(response.status).toBe(404);
    });

    it("should reject expired code", async () => {
      const studentToken = generateToken(student);
      // Create expired poll
      const expiredPoll = await prisma.attendancePoll.create({
        data: {
          sessionId: session.id,
          createdBy: professor.id,
          code: "11111111",
          expiresAt: new Date(Date.now() - 1000),
          durationMinutes: 10,
          active: true,
        },
      });

      const response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          code: expiredPoll.code,
        });

      expect(response.status).toBe(410);
    });

    it("should reject duplicate submission", async () => {
      const studentToken = generateToken(student);
      // First submission
      await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          code: poll.code,
        });

      // Second submission
      const response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          code: poll.code,
        });

      expect(response.status).toBe(409);
    });

    it("should handle concurrent submissions gracefully", async () => {
      const student2 = await prisma.user.create({
        data: {
          email: "student2@example.com",
          name: "Student 2",
          isProf: false,
        },
      });
      await classRoleService.upsertClassRole({
        userId: student2.id,
        classId: klass.id,
        role: "STUDENT",
      });

      const studentToken = generateToken(student);
      const student2Token = generateToken(student2);

      // Simulate concurrent requests
      const [response1, response2] = await Promise.all([
        request
          .post("/api/attendance/submit")
          .set("Cookie", `auth_token=${studentToken}`)
          .send({ code: poll.code }),
        request
          .post("/api/attendance/submit")
          .set("Cookie", `auth_token=${student2Token}`)
          .send({ code: poll.code }),
      ]);

      const successfulResponses = [response1, response2].filter(
        (res) => res.status === 200,
      ).length;

      const records = await prisma.attendanceRecord.findMany({
        where: { pollId: poll.id },
      });

      expect(records.length).toBeLessThanOrEqual(2);
      expect(successfulResponses).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/attendance/session/:sessionId", () => {
    it("should return session attendance for professor", async () => {
      const professorToken = generateToken(professor);
      // Create poll and submit attendance
      const poll = await attendancePollService.createAttendancePoll(
        session.id,
        10,
        professor.id,
      );
      await attendanceRecordService.submitAttendance(
        poll.code,
        student.id,
        null,
        null,
      );

      const response = await request
        .get(`/api/attendance/session/${session.id}`)
        .set("Cookie", `auth_token=${professorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("attendance");
      expect(response.body.attendance.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/attendance/student/me", () => {
    it("should return student's attendance history", async () => {
      const studentToken = generateToken(student);
      // Create poll and submit attendance
      const poll = await attendancePollService.createAttendancePoll(
        session.id,
        10,
        professor.id,
      );
      await attendanceRecordService.submitAttendance(
        poll.code,
        student.id,
        null,
        null,
      );

      const response = await request
        .get("/api/attendance/student/me")
        .set("Cookie", `auth_token=${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("attendance");
      expect(response.body.attendance.length).toBeGreaterThan(0);
    });
  });
});