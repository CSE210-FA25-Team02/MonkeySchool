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
    );

    expect(record).toBeDefined();
    expect(record.studentId).toBe(student.id);
    expect(record.sessionId).toBe(session.id);
    expect(record.pollId).toBe(poll.id);
  });

  it("should reject duplicate submission", async () => {
    // First submission
    await attendanceRecordService.submitAttendance(
      poll.code,
      student.id,
    );

    // Second submission should fail
    await expect(
      attendanceRecordService.submitAttendance(
        poll.code,
        student.id,
      ),
    ).rejects.toThrow("Already marked");
  });

  it("should reject submission with invalid code", async () => {
    await expect(
      attendanceRecordService.submitAttendance(
        "99999999",
        student.id,
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
      ),
    ).rejects.toThrow("Not enrolled");
  });

  it("should get session attendance", async () => {
    // Submit attendance
    await attendanceRecordService.submitAttendance(
      poll.code,
      student.id,
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
    );

    const history = await attendanceRecordService.getStudentAttendance(
      student.id,
    );

    expect(history.length).toBe(1);
    expect(history[0].sessionId).toBe(session.id);
    expect(history[0].status).toBe("present");
  });
});

describe("AttendancePoll Service - Additional Tests", () => {
  let professor, klass, session1, session2;

  beforeEach(async () => {
    await resetDatabase();

    professor = await prisma.user.create({
      data: {
        email: "prof@example.com",
        name: "Professor",
        isProf: true,
      },
    });

    klass = await classService.createClass({ name: "Test Class" });

    session1 = await courseSessionService.createCourseSession({
      classId: klass.id,
      name: "Session 1",
      date: new Date(),
    });

    session2 = await courseSessionService.createCourseSession({
      classId: klass.id,
      name: "Session 2",
      date: new Date(),
    });
  });

  describe("getPollsBySessionId", () => {
    it("should return all polls for a session", async () => {
      // Create multiple polls for the same session
      const poll1 = await attendancePollService.createAttendancePoll(
        session1.id,
        10,
        professor.id,
      );
      const poll2 = await attendancePollService.createAttendancePoll(
        session1.id,
        15,
        professor.id,
      );

      const polls = await attendancePollService.getPollsBySessionId(session1.id);

      expect(polls.length).toBe(2);
      expect(polls.map((p) => p.id)).toContain(poll1.id);
      expect(polls.map((p) => p.id)).toContain(poll2.id);
      expect(polls[0].creator).toBeDefined();
      expect(polls[0]._count).toBeDefined();
    });

    it("should return polls ordered by createdAt desc", async () => {
      const poll1 = await attendancePollService.createAttendancePoll(
        session1.id,
        10,
        professor.id,
      );
      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const poll2 = await attendancePollService.createAttendancePoll(
        session1.id,
        15,
        professor.id,
      );

      const polls = await attendancePollService.getPollsBySessionId(session1.id);

      expect(polls.length).toBe(2);
      // Most recent should be first
      expect(polls[0].id).toBe(poll2.id);
      expect(polls[1].id).toBe(poll1.id);
    });

    it("should return empty array for session with no polls", async () => {
      const polls = await attendancePollService.getPollsBySessionId(session2.id);
      expect(polls).toEqual([]);
    });

    it("should include record count for each poll", async () => {
      const poll = await attendancePollService.createAttendancePoll(
        session1.id,
        10,
        professor.id,
      );

      // Create a student and submit attendance
      const student = await prisma.user.create({
        data: {
          email: "student@example.com",
          name: "Student",
          isProf: false,
        },
      });
      await classRoleService.upsertClassRole({
        userId: student.id,
        classId: klass.id,
        role: "STUDENT",
      });
      await attendanceRecordService.submitAttendance(poll.code, student.id);

      const polls = await attendancePollService.getPollsBySessionId(session1.id);
      expect(polls[0]._count.records).toBe(1);
    });
  });

  describe("deactivatePoll", () => {
    it("should deactivate an active poll", async () => {
      const poll = await attendancePollService.createAttendancePoll(
        session1.id,
        10,
        professor.id,
      );

      expect(poll.active).toBe(true);

      const deactivated = await attendancePollService.deactivatePoll(poll.id);

      expect(deactivated.active).toBe(false);
      expect(deactivated.id).toBe(poll.id);
    });

    it("should not find deactivated poll by code", async () => {
      const poll = await attendancePollService.createAttendancePoll(
        session1.id,
        10,
        professor.id,
      );

      await attendancePollService.deactivatePoll(poll.id);

      const found = await attendancePollService.findActivePollByCode(poll.code);
      expect(found).toBeNull();
    });
  });
});

describe("AttendanceRecord Service - Additional Tests", () => {
  let professor, student1, student2, klass, session1, session2, poll1, poll2;

  beforeEach(async () => {
    await resetDatabase();

    professor = await prisma.user.create({
      data: {
        email: "prof@example.com",
        name: "Professor",
        isProf: true,
      },
    });

    student1 = await prisma.user.create({
      data: {
        email: "student1@example.com",
        name: "Student 1",
        isProf: false,
      },
    });

    student2 = await prisma.user.create({
      data: {
        email: "student2@example.com",
        name: "Student 2",
        isProf: false,
      },
    });

    klass = await classService.createClass({ name: "Test Class" });

    await classRoleService.upsertClassRole({
      userId: student1.id,
      classId: klass.id,
      role: "STUDENT",
    });

    await classRoleService.upsertClassRole({
      userId: student2.id,
      classId: klass.id,
      role: "STUDENT",
    });

    session1 = await courseSessionService.createCourseSession({
      classId: klass.id,
      name: "Session 1",
      date: new Date("2025-01-01"),
    });

    session2 = await courseSessionService.createCourseSession({
      classId: klass.id,
      name: "Session 2",
      date: new Date("2025-01-02"),
    });

    poll1 = await attendancePollService.createAttendancePoll(
      session1.id,
      10,
      professor.id,
    );

    poll2 = await attendancePollService.createAttendancePoll(
      session2.id,
      10,
      professor.id,
    );
  });

  describe("getCourseAttendanceSummary", () => {
    it("should return attendance summary for a course", async () => {
      // Submit attendance for both students in session1
      await attendanceRecordService.submitAttendance(poll1.code, student1.id);
      await attendanceRecordService.submitAttendance(poll1.code, student2.id);

      // Submit attendance for only student1 in session2
      await attendanceRecordService.submitAttendance(poll2.code, student1.id);

      const summary = await attendanceRecordService.getCourseAttendanceSummary(
        klass.id,
      );

      expect(summary.courseId).toBe(klass.id);
      expect(summary.sessions.length).toBe(2);
      expect(summary.students.length).toBe(2);

      // Check student1 attendance
      const student1Data = summary.students.find((s) => s.studentId === student1.id);
      expect(student1Data).toBeDefined();
      expect(student1Data.presentCount).toBe(2);
      expect(student1Data.totalSessions).toBe(2);
      expect(student1Data.attendancePercentage).toBe(100);
      expect(student1Data.sessions[session1.id]).toBeDefined();
      expect(student1Data.sessions[session1.id].present).toBe(true);

      // Check student2 attendance
      const student2Data = summary.students.find((s) => s.studentId === student2.id);
      expect(student2Data).toBeDefined();
      expect(student2Data.presentCount).toBe(1);
      expect(student2Data.totalSessions).toBe(2);
      expect(student2Data.attendancePercentage).toBe(50);
      expect(student2Data.sessions[session1.id].present).toBe(true);
      expect(student2Data.sessions[session2.id]).toBeUndefined();
    });

    it("should handle course with no attendance records", async () => {
      const summary = await attendanceRecordService.getCourseAttendanceSummary(
        klass.id,
      );

      expect(summary.courseId).toBe(klass.id);
      expect(summary.sessions.length).toBe(2);
      expect(summary.students.length).toBe(2);
      expect(summary.students.every((s) => s.presentCount === 0)).toBe(true);
      expect(summary.students.every((s) => s.attendancePercentage === 0)).toBe(
        true,
      );
    });

    it("should include session attendance counts", async () => {
      await attendanceRecordService.submitAttendance(poll1.code, student1.id);
      await attendanceRecordService.submitAttendance(poll1.code, student2.id);

      const summary = await attendanceRecordService.getCourseAttendanceSummary(
        klass.id,
      );

      const session1Data = summary.sessions.find((s) => s.id === session1.id);
      expect(session1Data.attendanceCount).toBe(2);

      const session2Data = summary.sessions.find((s) => s.id === session2.id);
      expect(session2Data.attendanceCount).toBe(0);
    });
  });

  describe("getCourseAttendanceRecords", () => {
    it("should return course attendance records in pivoted format", async () => {
      // Submit attendance
      await attendanceRecordService.submitAttendance(poll1.code, student1.id);
      await attendanceRecordService.submitAttendance(poll2.code, student1.id);
      await attendanceRecordService.submitAttendance(poll1.code, student2.id);

      const data = await attendanceRecordService.getCourseAttendanceRecords(
        klass.id,
      );

      expect(data.courseId).toBe(klass.id);
      expect(data.sessions.length).toBe(2);
      expect(data.students.length).toBe(2);

      // Check sessions are ordered by date ascending
      expect(data.sessions[0].id).toBe(session1.id);
      expect(data.sessions[1].id).toBe(session2.id);

      // Check student1 attendance
      const student1Data = data.students.find((s) => s.studentId === student1.id);
      expect(student1Data).toBeDefined();
      expect(student1Data.sessionAttendance[session1.id]).toBeDefined();
      expect(student1Data.sessionAttendance[session1.id].present).toBe(true);
      expect(student1Data.sessionAttendance[session2.id]).toBeDefined();
      expect(student1Data.sessionAttendance[session2.id].present).toBe(true);

      // Check student2 attendance
      const student2Data = data.students.find((s) => s.studentId === student2.id);
      expect(student2Data).toBeDefined();
      expect(student2Data.sessionAttendance[session1.id]).toBeDefined();
      expect(student2Data.sessionAttendance[session1.id].present).toBe(true);
      expect(student2Data.sessionAttendance[session2.id]).toBeNull();
    });

    it("should include all enrolled students even without attendance", async () => {
      const data = await attendanceRecordService.getCourseAttendanceRecords(
        klass.id,
      );

      expect(data.students.length).toBe(2);
      expect(
        data.students.every((s) => s.sessionAttendance[session1.id] === null),
      ).toBe(true);
      expect(
        data.students.every((s) => s.sessionAttendance[session2.id] === null),
      ).toBe(true);
    });

    it("should order students by name", async () => {
      // Update student names to test ordering
      await prisma.user.update({
        where: { id: student1.id },
        data: { name: "Zebra Student" },
      });
      await prisma.user.update({
        where: { id: student2.id },
        data: { name: "Alpha Student" },
      });

      const data = await attendanceRecordService.getCourseAttendanceRecords(
        klass.id,
      );

      expect(data.students[0].name).toBe("Alpha Student");
      expect(data.students[1].name).toBe("Zebra Student");
    });
  });

  describe("getStudentAttendanceGroupedByCourse", () => {
    it("should return student attendance grouped by course", async () => {
      // Submit attendance for multiple sessions
      await attendanceRecordService.submitAttendance(poll1.code, student1.id);
      await attendanceRecordService.submitAttendance(poll2.code, student1.id);

      const grouped = await attendanceRecordService.getStudentAttendanceGroupedByCourse(
        student1.id,
      );

      expect(grouped.length).toBe(1);
      expect(grouped[0].courseId).toBe(klass.id);
      expect(grouped[0].courseName).toBe("Test Class");
      expect(grouped[0].attendances.length).toBe(2);
      expect(grouped[0].attendances[0].status).toBe("present");
      expect(grouped[0].attendances[0].sessionName).toBeDefined();
    });

    it("should group attendances by course correctly", async () => {
      // Create another class and session
      const klass2 = await classService.createClass({ name: "Another Class" });
      await classRoleService.upsertClassRole({
        userId: student1.id,
        classId: klass2.id,
        role: "STUDENT",
      });
      const session3 = await courseSessionService.createCourseSession({
        classId: klass2.id,
        name: "Session 3",
        date: new Date(),
      });
      const poll3 = await attendancePollService.createAttendancePoll(
        session3.id,
        10,
        professor.id,
      );

      // Submit attendance across multiple courses
      await attendanceRecordService.submitAttendance(poll1.code, student1.id);
      await attendanceRecordService.submitAttendance(poll3.code, student1.id);

      const grouped = await attendanceRecordService.getStudentAttendanceGroupedByCourse(
        student1.id,
      );

      expect(grouped.length).toBe(2);
      // Should be sorted by course name
      expect(grouped[0].courseName).toBe("Another Class");
      expect(grouped[1].courseName).toBe("Test Class");
    });

    it("should return empty array for student with no attendance", async () => {
      const grouped = await attendanceRecordService.getStudentAttendanceGroupedByCourse(
        student1.id,
      );

      expect(grouped).toEqual([]);
    });

    it("should include poll code in attendance records", async () => {
      await attendanceRecordService.submitAttendance(poll1.code, student1.id);

      const grouped = await attendanceRecordService.getStudentAttendanceGroupedByCourse(
        student1.id,
      );

      expect(grouped[0].attendances[0].pollCode).toBe(poll1.code);
    });
  });
});