// code/tests/attendance/attendance.api.test.js

import { describe, it, expect, beforeEach } from "@jest/globals";
import { prisma } from "../../src/lib/prisma.js";
import { resetDatabase } from "../utils/reset-db.js";
import { request } from "../steps.config.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import * as courseSessionService from "../../src/services/courseSession.service.js";
import * as attendancePollService from "../../src/services/attendancePoll.service.js";
import * as attendanceRecordService from "../../src/services/attendanceRecord.service.js";

describe("Attendance API", () => {
  let professor, student, klass, session;
  let professorToken, studentToken;

  beforeEach(async () => {
    await resetDatabase();

    // Create professor
    professor = await prisma.user.create({
      data: {
        email: "prof@example.com",
        name: "Professor",
        isProf: true,
      },
    });

    // Create student
    student = await prisma.user.create({
      data: {
        email: "student@example.com",
        name: "Student",
        isProf: false,
      },
    });

    // Create tokens (simplified - in real app use proper JWT)
    professorToken = "mock-prof-token";
    studentToken = "mock-student-token";

    // Create class
    klass = await classService.createClass({ name: "Test Class" });

    // Enroll professor
    await classRoleService.upsertClassRole({
      userId: professor.id,
      classId: klass.id,
      role: "PROFESSOR",
    });

    // Enroll student
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
      const response = await request
        .post("/api/attendance/poll/create")
        .set("Cookie", `auth_token=${professorToken}`)
        .send({
          sessionId: session.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("code");
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
      const response = await request
        .post("/api/attendance/submit")
        .set("Cookie", `auth_token=${studentToken}`)
        .send({
          code: "99999999",
        });

      expect(response.status).toBe(404);
    });

    it("should reject expired code", async () => {
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
  });

  describe("GET /api/attendance/session/:sessionId", () => {
    it("should return session attendance for professor", async () => {
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

