// code/tests/attendance/attendance.service.test.js

import { describe, it, expect, beforeEach } from "@jest/globals";
import { prisma } from "../../src/lib/prisma.js";
import { resetDatabase } from "../utils/reset-db.js";
import { generateUniqueCode, validateCodeFormat } from "../../src/utils/code-generator.js";
import * as attendancePollService from "../../src/services/attendancePoll.service.js";
import * as attendanceRecordService from "../../src/services/attendanceRecord.service.js";
import * as courseSessionService from "../../src/services/courseSession.service.js";
import * as classService from "../../src/services/class.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";

describe("Code Generator", () => {
  it("should generate a unique 8-digit code", async () => {
    const codes = new Set();
    const uniquenessChecker = async (code) => {
      if (codes.has(code)) {
        return false;
      }
      codes.add(code);
      return true;
    };

    const code = await generateUniqueCode(uniquenessChecker);
    expect(code).toMatch(/^\d{8}$/);
    expect(codes.has(code)).toBe(true);
  });

  it("should validate code format correctly", () => {
    expect(validateCodeFormat("12345678")).toBe(true);
    expect(validateCodeFormat("00000000")).toBe(true);
    expect(validateCodeFormat("1234567")).toBe(false); // Too short
    expect(validateCodeFormat("123456789")).toBe(false); // Too long
    expect(validateCodeFormat("abcdefgh")).toBe(false); // Not numeric
    expect(validateCodeFormat("")).toBe(false);
  });
});

describe("AttendancePoll Service", () => {
  let professor, klass, session;

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

    // Create class
    klass = await classService.createClass({ name: "Test Class" });

    // Create session
    session = await courseSessionService.createCourseSession({
      classId: klass.id,
      name: "Test Session",
      date: new Date(),
    });
  });

  it("should create an attendance poll with unique code", async () => {
    const poll = await attendancePollService.createAttendancePoll(
      session.id,
      10,
      professor.id,
    );

    expect(poll).toBeDefined();
    expect(poll.code).toMatch(/^\d{8}$/);
    expect(poll.sessionId).toBe(session.id);
    expect(poll.createdBy).toBe(professor.id);
    expect(poll.durationMinutes).toBe(10);
    expect(poll.active).toBe(true);

    // Check expiration is in the future
    const expiresAt = new Date(poll.expiresAt);
    const now = new Date();
    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should use default duration when not provided", async () => {
    const poll = await attendancePollService.createAttendancePoll(
      session.id,
      null,
      professor.id,
    );

    expect(poll.durationMinutes).toBeGreaterThan(0);
  });

  it("should find active poll by code", async () => {
    const poll = await attendancePollService.createAttendancePoll(
      session.id,
      10,
      professor.id,
    );

    const found = await attendancePollService.findActivePollByCode(poll.code);
    expect(found).not.toBeNull();
    expect(found.id).toBe(poll.id);
  });

  it("should not find expired poll", async () => {
    // Create an expired poll manually
    const expiredPoll = await prisma.attendancePoll.create({
      data: {
        sessionId: session.id,
        createdBy: professor.id,
        code: "12345678",
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        durationMinutes: 10,
        active: true,
      },
    });

    const found = await attendancePollService.findActivePollByCode(
      expiredPoll.code,
    );
    expect(found).toBeNull();
  });

  it("should check if poll is expired", () => {
    const activePoll = {
      expiresAt: new Date(Date.now() + 60000), // 1 minute in future
    };
    const expiredPoll = {
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
    };

    expect(attendancePollService.isPollExpired(activePoll)).toBe(false);
    expect(attendancePollService.isPollExpired(expiredPoll)).toBe(true);
    expect(attendancePollService.isPollExpired(null)).toBe(true);
  });
});

describe("AttendanceRecord Service", () => {
  let professor, student, klass, session, poll;

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

    // Create class
    klass = await classService.createClass({ name: "Test Class" });

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

    // Create poll
    poll = await attendancePollService.createAttendancePoll(
      session.id,
      10,
      professor.id,
    );
  });

  it("should submit attendance successfully", async () => {
    const record = await attendanceRecordService.submitAttendance(
      poll.code,
      student.id,
      "127.0.0.1",
      "Test Agent",
    );

    expect(record).toBeDefined();
    expect(record.studentId).toBe(student.id);
    expect(record.sessionId).toBe(session.id);
    expect(record.pollId).toBe(poll.id);
    expect(record.ipAddress).toBe("127.0.0.1");
    expect(record.userAgent).toBe("Test Agent");
  });

  it("should reject duplicate submission", async () => {
    // First submission
    await attendanceRecordService.submitAttendance(
      poll.code,
      student.id,
      null,
      null,
    );

    // Second submission should fail
    await expect(
      attendanceRecordService.submitAttendance(
        poll.code,
        student.id,
        null,
        null,
      ),
    ).rejects.toThrow("Already marked");
  });

  it("should reject submission with invalid code", async () => {
    await expect(
      attendanceRecordService.submitAttendance(
        "99999999",
        student.id,
        null,
        null,
      ),
    ).rejects.toThrow();
  });

  it("should reject submission for unenrolled student", async () => {
    // Create another student not enrolled
    const unenrolledStudent = await prisma.user.create({
      data: {
        email: "unenrolled@example.com",
        name: "Unenrolled",
        isProf: false,
      },
    });

    await expect(
      attendanceRecordService.submitAttendance(
        poll.code,
        unenrolledStudent.id,
        null,
        null,
      ),
    ).rejects.toThrow("Not enrolled");
  });

  it("should get session attendance", async () => {
    // Submit attendance
    await attendanceRecordService.submitAttendance(
      poll.code,
      student.id,
      null,
      null,
    );

    const attendance = await attendanceRecordService.getSessionAttendance(
      session.id,
    );

    expect(attendance.length).toBe(1);
    expect(attendance[0].student.id).toBe(student.id);
  });

  it("should get student attendance history", async () => {
    // Submit attendance
    await attendanceRecordService.submitAttendance(
      poll.code,
      student.id,
      null,
      null,
    );

    const history = await attendanceRecordService.getStudentAttendance(
      student.id,
    );

    expect(history.length).toBe(1);
    expect(history[0].sessionId).toBe(session.id);
    expect(history[0].status).toBe("present");
  });
});

