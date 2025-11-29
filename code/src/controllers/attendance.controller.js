// Attendance Controller
// code/src/controllers/attendance.controller.js

import * as attendancePollService from "../services/attendancePoll.service.js";
import * as attendanceRecordService from "../services/attendanceRecord.service.js";
import * as courseSessionService from "../services/courseSession.service.js";
import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError, ForbiddenError } from "../utils/api-error.js";
import { createBaseLayout } from "../utils/html-templates.js";
import {
  createPollSchema,
  submitAttendanceSchema,
} from "../validators/attendance.validator.js";
// Note: attendance-templates.js exports are imported dynamically where needed
import { env } from "../config/env.js";

/**
 * Create an attendance poll for a session
 * Auth: professor (must teach the class)
 */
export const createPoll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Handle both form-encoded and JSON
  let body = req.body;
  if (typeof body.durationMinutes === "string") {
    body.durationMinutes = body.durationMinutes
      ? parseInt(body.durationMinutes, 10)
      : undefined;
  }

  // Validate input
  const validation = createPollSchema.safeParse(body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    });
  }

  const { sessionId, durationMinutes } = validation.data;

  // Get session and verify professor owns the class
  const session = await courseSessionService.getCourseSessionById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can create attendance polls");
  }

  // Create poll
  const poll = await attendancePollService.createAttendancePoll(
    sessionId,
    durationMinutes,
    userId,
  );

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    // Close modal and refresh attendance page to show new code
    // Use HX-Redirect to navigate to attendance page (HTMX will handle it)
    res.status(201).header("HX-Redirect", "/attendance").send("");
  } else {
    res.status(201).json({
      pollId: poll.id,
      code: poll.code,
      expiresAt: poll.expiresAt,
      sessionId: poll.sessionId,
    });
  }
});

/**
 * Submit attendance using a code
 * Auth: student
 */
export const submitAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Handle both form-encoded and JSON
  const body = req.body;

  // Validate input
  const validation = submitAttendanceSchema.safeParse(body);
  if (!validation.success) {
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      const { displayAttendanceResult } = await import(
        "../utils/htmx-templates/attendance-templates.js"
      );
      const errorHtml = displayAttendanceResult({
        success: false,
        error: "Invalid code format. Please enter an 8-digit code.",
      });
      return res.status(400).send(errorHtml);
    }
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    });
  }

  const { code } = validation.data;

  try {
    // Submit attendance (atomic operation)
    const record = await attendanceRecordService.submitAttendance(code, userId);

    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // Import display function
      const { displayAttendanceResult } = await import(
        "../utils/htmx-templates/attendance-templates.js"
      );
      const resultHtml = displayAttendanceResult({
        success: true,
        status: "success",
        sessionId: record.sessionId,
        markedAt: record.markedAt,
        courseName: record.session.class.name,
        sessionName: record.session.name,
      });
      res.status(200).send(resultHtml);
    } else {
      res.status(200).json({
        status: "success",
        sessionId: record.sessionId,
        markedAt: record.markedAt,
      });
    }
  } catch (error) {
    // Error handling is done by the service, but we need to format the response
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      const { displayAttendanceResult } = await import(
        "../utils/htmx-templates/attendance-templates.js"
      );
      const errorHtml = displayAttendanceResult({
        success: false,
        error: error.message || "Failed to submit attendance",
      });
      return res.status(error.statusCode || 500).send(errorHtml);
    } else {
      res.status(error.statusCode || 500).json({
        error: error.message || "Failed to submit attendance",
      });
    }
    // Don't re-throw for HTMX requests as we've handled it
    if (!isHtmxRequest) {
      throw error;
    }
  }
});

/**
 * Get session-wise attendance records page
 * Path: /course/session/records
 * Auth: professor (must teach the class) or admin
 */
export const getSessionRecordsPage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  // Get session
  const session = await courseSessionService.getCourseSessionById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check authorization
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  const isAdmin = req.user.isProf;
  if (!isProfessor && !isAdmin) {
    throw new ForbiddenError("Only professors can view session attendance");
  }

  // Get attendance records
  const attendance =
    await attendanceRecordService.getSessionAttendance(sessionId);

  const isHtmxRequest = req.headers["hx-request"];

  const { displaySessionRecordsPage } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const html = displaySessionRecordsPage({
    sessionId,
    sessionName: session.name,
    courseName: klass.name,
    courseId: klass.id,
    attendance: attendance.map((a) => ({
      studentId: a.student.id,
      name: a.student.name,
      email: a.student.email,
      markedAt: a.markedAt,
    })),
  });

  if (isHtmxRequest) {
    res.send(html);
  } else {
    // For direct navigation, use createBaseLayout
    const fullPage = createBaseLayout(
      `${session.name} - Attendance Records`,
      html,
      { user: req.user },
    );
    res.send(fullPage);
  }
});

/**
 * Get course-wise attendance records page
 * Path: /course/records
 * Auth: professor (must teach the class) or admin
 */
export const getCourseRecordsPage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;

  // Check authorization
  const klass = await classService.getClassById(courseId);
  if (!klass) {
    throw new NotFoundError("Course not found");
  }

  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  const isAdmin = req.user.isProf;
  if (!isProfessor && !isAdmin) {
    throw new ForbiddenError("Only professors can view course attendance");
  }

  // Get attendance records for all sessions in the course
  const data =
    await attendanceRecordService.getCourseAttendanceRecords(courseId);

  const isHtmxRequest = req.headers["hx-request"];

  const { displayCourseRecordsPage } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const html = displayCourseRecordsPage({
    courseId: klass.id,
    courseName: klass.name,
    sessions: data.sessions,
    students: data.students,
  });

  if (isHtmxRequest) {
    res.send(html);
  } else {
    // For direct navigation, use createBaseLayout
    const fullPage = createBaseLayout(
      `${klass.name} - Attendance Records`,
      html,
      { user: req.user },
    );
    res.send(fullPage);
  }
});

/**
 * Get attendance records for a session
 * Auth: professor (must teach the class) or admin
 */
export const getSessionAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  // Get session
  const session = await courseSessionService.getCourseSessionById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check authorization
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  const isAdmin = req.user.isProf; // Simple admin check - adjust as needed
  if (!isProfessor && !isAdmin) {
    throw new ForbiddenError("Only professors can view session attendance");
  }

  // Get polls and attendance
  const polls = await attendancePollService.getPollsBySessionId(sessionId);
  const attendance =
    await attendanceRecordService.getSessionAttendance(sessionId);

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    const { displaySessionAttendance } = await import(
      "../utils/htmx-templates/attendance-templates.js"
    );
    const data = {
      sessionId,
      sessionName: session.name,
      polls: polls.map((p) => ({
        pollId: p.id,
        code: p.code,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
        recordCount: p._count.records,
      })),
      attendance: attendance.map((a) => ({
        studentId: a.student.id,
        name: a.student.name,
        email: a.student.email,
        markedAt: a.markedAt,
        pollId: a.poll && a.poll.id,
        pollCode: a.poll && a.poll.code,
      })),
    };
    const html = displaySessionAttendance(data);
    res.send(html);
  } else {
    res.json({
      sessionId,
      polls: polls.map((p) => ({
        pollId: p.id,
        code: p.code,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
        recordCount: p._count.records,
      })),
      attendance: attendance.map((a) => ({
        studentId: a.student.id,
        name: a.student.name,
        email: a.student.email,
        markedAt: a.markedAt,
        pollId: a.poll && a.poll.id,
        pollCode: a.poll && a.poll.code,
      })),
    });
  }
});

/**
 * Get attendance summary for a course
 * Auth: professor (must teach the class) or admin
 */
export const getCourseAttendanceSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;

  // Check authorization
  const klass = await classService.getClassById(courseId);
  if (!klass) {
    throw new NotFoundError("Course not found");
  }

  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  const isAdmin = req.user.isProf; // Simple admin check
  if (!isProfessor && !isAdmin) {
    throw new ForbiddenError("Only professors can view course attendance");
  }

  const summary =
    await attendanceRecordService.getCourseAttendanceSummary(courseId);

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    const { displayCourseAttendanceSummary } = await import(
      "../utils/htmx-templates/attendance-templates.js"
    );
    const html = displayCourseAttendanceSummary(summary);
    res.send(html);
  } else {
    res.json(summary);
  }
});

/**
 * Get student's personal attendance history
 * Auth: student (themselves)
 */
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    // For HTMX requests, return grouped data with collapsible UI
    const { displayStudentAttendanceGrouped } = await import(
      "../utils/htmx-templates/attendance-templates.js"
    );
    const groupedAttendance =
      await attendanceRecordService.getStudentAttendanceGroupedByCourse(userId);
    const html = displayStudentAttendanceGrouped({
      studentId: userId,
      courses: groupedAttendance,
    });
    res.send(html);
  } else {
    // For JSON API requests, return flat list (backward compatibility)
    const attendance =
      await attendanceRecordService.getStudentAttendance(userId);
    res.json({
      studentId: userId,
      attendance,
    });
  }
});

/**
 * Get attendance poll form (HTMX)
 */
export const getAttendancePollForm = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({
      error: "Session ID required",
    });
  }

  const defaultDuration = env.ATTENDANCE_DEFAULT_DURATION;
  const { createStartAttendanceModal } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const formHtml = createStartAttendanceModal(sessionId, defaultDuration);
  res.send(formHtml);
});

/**
 * Get code status for a session (HTMX polling)
 * Auth: professor (must teach the class)
 */
export const getSessionCodeStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  // Get session
  const session = await courseSessionService.getCourseSessionById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check authorization
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can view code status");
  }

  // Get latest poll
  const polls = await attendancePollService.getPollsBySessionId(sessionId);
  const latestPoll = polls.length > 0 ? polls[0] : null;

  const { getCodeStatusFragment } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const html = getCodeStatusFragment(latestPoll);
  res.send(html);
});

/**
 * Toggle course pane (for collapsible course sections)
 * Auth: professor
 */
export const toggleCoursePane = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;
  const { expanded } = req.query; // "true" or "false"

  // Check authorization
  const klass = await classService.getClassById(courseId);
  if (!klass) {
    throw new NotFoundError("Course not found");
  }

  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can view course attendance");
  }

  // Get sessions for the class
  const sessions = await courseSessionService.getSessionsByClassId(courseId);
  const wasExpanded = expanded === "true" || expanded === true;
  const isExpanded = !wasExpanded; // Toggle the state

  const { displayCourseItem } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const html = displayCourseItem({
    course: klass,
    sessions,
    isExpanded,
  });
  res.send(html);
});

/**
 * Get main attendance page
 * Shows different content based on user role (student vs professor)
 */
export const getAttendancePage = asyncHandler(async (req, res) => {
  const user = req.user;
  const userId = user.id;
  const isHtmxRequest = req.headers["hx-request"];

  // Import the new unified template
  const { renderAttendancePage } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );

  // Get user's classes
  const userClasses = await classService.getClassesByUserId(userId);
  const professorClasses = userClasses.filter((c) => c.role === "PROFESSOR");

  let courses = [];
  let studentHistory = [];

  if (professorClasses.length > 0) {
    // Professor view: get sessions for each class
    courses = await Promise.all(
      professorClasses.map(async (klass) => {
        const sessions = await courseSessionService.getSessionsByClassId(
          klass.id,
        );
        return {
          id: klass.id.replace(/-/g, ""),
          name: klass.name,
          quarter: klass.quarter,
          sessions: sessions.map((s) => ({
            id: s.id,
            name: s.name,
            date: new Date(s.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            time: s.startTime || "10:00 AM",
            code: (s.poll && s.poll.code) || "---- ----",
            status:
              s.poll && s.poll.expiresAt > new Date() ? "active" : "expired",
          })),
        };
      }),
    );
  } else {
    // Student view: get attendance history
    const groupedAttendance =
      await attendanceRecordService.getStudentAttendanceGroupedByCourse(userId);
    studentHistory = groupedAttendance.map((g) => ({
      course: g.courseName,
      rate: `${g.attendanceRate}%`,
      records: g.records.map((r) => ({
        date: new Date(r.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        session: r.sessionName,
        time: r.markedAt
          ? new Date(r.markedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--",
        status: r.status,
      })),
    }));
  }

  // Render page with data
  const html = renderAttendancePage(user, courses, studentHistory);

  if (isHtmxRequest) {
    res.send(html);
  } else {
    const fullPage = createBaseLayout("Attendance", html, { user });
    res.send(fullPage);
  }
});
