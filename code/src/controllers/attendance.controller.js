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
  markAttendanceSchema,
} from "../validators/attendance.validator.js";
// Note: attendance-templates.js exports are imported dynamically where needed
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";


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
 * Mark attendance with course selection (HTMX)
 * Auth: student
 * Route: POST /attendance/mark
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Handle both form-encoded and JSON
  const body = req.body;

  // Validate input
  const validation = markAttendanceSchema.safeParse(body);
  if (!validation.success) {
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // Get student courses only (role = 'STUDENT')
      const enrolledCourses = await classService.getStudentCoursesByUserId(userId);

      const { renderStudentAttendanceForm } = await import(
        "../utils/htmx-templates/attendance-templates.js"
      );
      const errorHtml = renderStudentAttendanceForm({
        courses: enrolledCourses,
        selectedCourseId: body.courseId || "",
        code: body.code || "",
        error: "Invalid code format. Please enter an 8-digit code.",
      });
      return res.status(400).send(errorHtml);
    }
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    });
  }

  const { code, courseId } = validation.data;

  try {
    // Submit attendance with course validation
    const record = await attendanceRecordService.submitAttendanceWithCourse(
      code,
      courseId,
      userId
    );

    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // Check if this was an idempotent success (already marked)
      const isAlreadyMarked =
        record.markedAt &&
        new Date(record.markedAt).getTime() < Date.now() - 1000; // Marked more than 1 second ago

      const { renderStudentAttendanceSuccess } = await import(
        "../utils/htmx-templates/attendance-templates.js"
      );
      const resultHtml = renderStudentAttendanceSuccess({
        courseName: record.session.class.name,
        sessionName: record.session.name,
        markedAt: record.markedAt,
        alreadyMarked: isAlreadyMarked,
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
    // Error handling
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // Get student courses only (role = 'STUDENT')
      const enrolledCourses = await classService.getStudentCoursesByUserId(userId);

      const { renderStudentAttendanceForm } = await import(
        "../utils/htmx-templates/attendance-templates.js"
      );
      const errorHtml = renderStudentAttendanceForm({
        courses: enrolledCourses,
        selectedCourseId: courseId || "",
        code: body.code || "",
        error: error.message || "Failed to mark attendance",
      });
      return res.status(error.statusCode || 500).send(errorHtml);
    } else {
      res.status(error.statusCode || 500).json({
        error: error.message || "Failed to mark attendance",
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

  // Get all enrolled students for the course
  const enrolledStudents = await prisma.classRole.findMany({
    where: {
      classId: session.classId,
      role: {
        in: ["STUDENT", "TA", "TUTOR"],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  const isHtmxRequest = req.headers["hx-request"];

  const { renderSessionRecordsPage } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const html = renderSessionRecordsPage({
    sessionId,
    sessionName: session.name,
    courseName: klass.name,
    courseId: klass.id,
    students: enrolledStudents.map((cr) => ({
      id: cr.user.id,
      name: cr.user.name,
      email: cr.user.email,
    })),
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
  const { createMainContentWrapper } = await import(
    "../utils/html-templates.js"
  );
  
  const content = displayCourseRecordsPage({
    courseId: klass.id,
    courseName: klass.name,
    sessions: data.sessions,
    students: data.students,
  });

  if (isHtmxRequest) {
    // For HTMX requests, wrap content with header and content-canvas structure
    const wrappedContent = createMainContentWrapper(
      "Attendance Records",
      content,
      {
        user: req.user,
        breadcrumbPath: "Dashboard / Attendance / Records",
      },
    );
    res.send(wrappedContent);
  } else {
    // For direct navigation, use createBaseLayout
    const fullPage = createBaseLayout(
      `${klass.name} - Attendance Records`,
      content,
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
 * Get new poll form for a specific session (HTMX)
 * Route: GET /course/:courseId/session/:sessionId/poll/new
 */
export const getNewPollForm = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId, sessionId } = req.params;

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

  const defaultDuration = env.ATTENDANCE_DEFAULT_DURATION;
  const { createStartAttendanceModal } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const formHtml = createStartAttendanceModal(sessionId, courseId, defaultDuration);
  res.send(formHtml);
});

/**
 * Start a poll for a specific session (HTMX)
 * Route: POST /course/:courseId/session/:sessionId/poll/start
 */
export const startPoll = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId, sessionId } = req.params;

  // Handle both form-encoded and JSON
  let body = req.body;
  if (typeof body.durationMinutes === "string") {
    body.durationMinutes = body.durationMinutes
      ? parseInt(body.durationMinutes, 10)
      : undefined;
  }

  // Validate input
  const validation = createPollSchema.safeParse({
    ...body,
    sessionId,
  });
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    });
  }

  const { durationMinutes } = validation.data;

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

  // Get updated session data for rendering
  const updatedSession = await courseSessionService.getCourseSessionById(sessionId);
  
  // Render updated session row
  const { renderSessionRow } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  
  // Get the latest poll (should be the one we just created)
  const latestPoll = updatedSession.attendancePolls && updatedSession.attendancePolls.length > 0
    ? updatedSession.attendancePolls[0]
    : poll;
  
  const pollCode = latestPoll.code.slice(0, 4) + " " + latestPoll.code.slice(4);
  const isActive = latestPoll && latestPoll.expiresAt > new Date();
  
  const sessionData = {
    id: updatedSession.id,
    name: updatedSession.name,
    date: new Date(updatedSession.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: updatedSession.startTime 
      ? new Date(updatedSession.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "10:00 AM",
    code: pollCode,
    status: isActive ? "active" : "expired",
    expiresAt: latestPoll ? latestPoll.expiresAt : null,
  };

  const rowHtml = renderSessionRow(sessionData, courseId);
  res.send(rowHtml);
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
 * Get courses for a user (where user is a student)
 * Route: GET /api/user/:userId/courses
 * Auth: user (must be the same user or admin)
 */
export const getUserCourses = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Verify the user is accessing their own courses or is admin
  if (userId !== currentUserId && !req.user.isProf) {
    throw new ForbiddenError("You can only view your own courses");
  }

  // Get user's classes where they are a student
  const userClasses = await classService.getClassesByUserId(userId);
  const studentClasses = userClasses.filter(
    (c) => c.role === "STUDENT" || c.role === "TA" || c.role === "TUTOR"
  );

  const courses = studentClasses.map((klass) => ({
    id: klass.id,
    name: klass.name,
    quarter: klass.quarter,
    code: klass.inviteCode, // Optional course code
  }));

  res.json({
    userId,
    courses,
  });
});

/**
 * Get attendance records for a student in a course (JSON API)
 * Route: GET /api/course/:courseId/user/:userId/records
 * Auth: student (must be the same user or enrolled in the course)
 */
export const getStudentCourseRecords = asyncHandler(async (req, res) => {
  const { courseId, userId } = req.params;
  const currentUserId = req.user.id;

  // Verify the user is accessing their own records or is enrolled in the course
  if (userId !== currentUserId) {
    // Check if user is enrolled in the course (for admin/professor access)
    const klass = await classService.getClassById(courseId);
    if (!klass) {
      throw new NotFoundError("Course not found");
    }
    
    const isEnrolled = klass.members.some(
      (member) => member.userId === currentUserId
    );
    const isAdmin = req.user.isProf;
    
    if (!isEnrolled && !isAdmin) {
      throw new ForbiddenError("You can only view your own attendance records");
    }
  }

  // Verify the target user is enrolled in the course
  const klass = await classService.getClassById(courseId);
  if (!klass) {
    throw new NotFoundError("Course not found");
  }

  const targetUserEnrolled = klass.members.some(
    (member) => member.userId === userId
  );
  if (!targetUserEnrolled) {
    throw new ForbiddenError("User is not enrolled in this course");
  }

  // Get student attendance data for the course
  const attendanceData = await attendanceRecordService.getStudentCourseAttendance(
    courseId,
    userId
  );

  // Get user info
  const { getUserById } = await import("../services/user.service.js");
  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  res.json({
    courseId: klass.id,
    courseName: klass.name,
    userId: targetUser.id,
    userName: targetUser.name,
    sessions: attendanceData.sessions,
    attendancePercentage: attendanceData.attendancePercentage,
    totalSessions: attendanceData.totalSessions,
    presentCount: attendanceData.presentCount,
  });
});

/**
 * Get student attendance records page for a specific course
 * Route: GET /course/:courseId/user/:userId/records
 * Auth: student (must be the same user or enrolled in the course)
 */
export const getStudentCourseRecordsPage = asyncHandler(async (req, res) => {
  const { courseId, userId } = req.params;
  const currentUserId = req.user.id;
  const isHtmxRequest = req.headers["hx-request"];

  // Verify the user is accessing their own records or is enrolled in the course
  if (userId !== currentUserId) {
    // Check if user is enrolled in the course (for admin/professor access)
    const klass = await classService.getClassById(courseId);
    if (!klass) {
      throw new NotFoundError("Course not found");
    }
    
    const isEnrolled = klass.members.some(
      (member) => member.userId === currentUserId
    );
    const isAdmin = req.user.isProf;
    
    if (!isEnrolled && !isAdmin) {
      throw new ForbiddenError("You can only view your own attendance records");
    }
  }

  // Verify the target user is enrolled in the course
  const klass = await classService.getClassById(courseId);
  if (!klass) {
    throw new NotFoundError("Course not found");
  }

  const targetUserEnrolled = klass.members.some(
    (member) => member.userId === userId
  );
  if (!targetUserEnrolled) {
    throw new ForbiddenError("User is not enrolled in this course");
  }

  // Get student attendance data for the course
  const attendanceData = await attendanceRecordService.getStudentCourseAttendance(
    courseId,
    userId
  );

  // Get user info
  const { getUserById } = await import("../services/user.service.js");
  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  const { renderStudentAttendanceRecordsPage } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const { createMainContentWrapper } = await import(
    "../utils/html-templates.js"
  );

  const html = renderStudentAttendanceRecordsPage({
    courseId: klass.id,
    courseName: klass.name,
    userId: targetUser.id,
    userName: targetUser.name,
    sessions: attendanceData.sessions,
    attendancePercentage: attendanceData.attendancePercentage,
  });

  if (isHtmxRequest) {
    // For HTMX requests, wrap content with header and content-canvas structure
    const wrappedContent = createMainContentWrapper(
      "Attendance Records",
      html,
      {
        user: req.user,
        breadcrumbPath: "Dashboard / Attendance / Records",
      },
    );
    res.send(wrappedContent);
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
  // Include PROFESSOR, TA, and TUTOR roles for professor view
  const professorClasses = userClasses.filter((c) => 
    c.role === "PROFESSOR" || c.role === "TA" || c.role === "TUTOR"
  );

  // Prepare professor courses (if user is a professor)
  let professorCourses = [];
  if (professorClasses.length > 0) {
    professorCourses = await Promise.all(
      professorClasses.map(async (klass) => {
        const sessions = await courseSessionService.getSessionsByClassId(
          klass.id,
        );
        return {
          id: klass.id.replace(/-/g, ""),
          classId: klass.id, // Store original classId for API calls
          name: klass.name,
          quarter: klass.quarter,
          sessions: sessions.map((s) => {
            const latestPoll = s.attendancePolls && s.attendancePolls.length > 0 ? s.attendancePolls[0] : null;
            const pollCode = latestPoll 
              ? latestPoll.code.slice(0, 4) + " " + latestPoll.code.slice(4)
              : "---- ----";
            const isActive = latestPoll && new Date(latestPoll.expiresAt) > new Date();
            
            return {
              id: s.id,
              name: s.name,
              date: new Date(s.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              time: s.startTime 
                ? new Date(s.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "10:00 AM",
              code: pollCode,
              status: isActive ? "active" : "expired",
              expiresAt: latestPoll ? latestPoll.expiresAt : null,
            };
          }),
        };
      }),
    );
  }

  // Prepare student courses and history (always fetch for student view)
  let studentCourses = [];
  let studentHistory = [];
  
  // Get student courses only (role = 'STUDENT') for dropdown and course cards
  const studentClasses = await classService.getStudentCoursesByUserId(userId);
  studentCourses = studentClasses.map((klass) => ({
    id: klass.id,
    name: klass.name,
    quarter: klass.quarter,
  }));

  // Get student attendance history if student has courses
  if (studentClasses.length > 0) {
    const groupedAttendance =
      await attendanceRecordService.getStudentAttendanceGroupedByCourse(userId);
    
    // Calculate attendance rate for each course
    studentHistory = await Promise.all(
      groupedAttendance.map(async (g) => {
        // Get all sessions for this course to calculate attendance rate
        const courseSessions = await courseSessionService.getSessionsByClassId(g.courseId);
        const totalSessions = courseSessions.length;
        const attendedSessions = g.attendances.length;
        const attendanceRate = totalSessions > 0 
          ? Math.round((attendedSessions / totalSessions) * 100)
          : 0;
        
        return {
          course: g.courseName,
          rate: `${attendanceRate}%`,
          records: (g.attendances || []).map((r) => ({
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
            status: r.status || "present",
          })),
        };
      })
    );
  }

  // Calculate flags for empty states
  const hasProfessorCourses = professorClasses.length > 0;
  const hasStudentCourses = studentClasses.length > 0;
  const hasAttendanceRecords = studentHistory.length > 0;

  // Render page with data - pass both professor and student courses separately, plus empty state flags
  const { createMainContentWrapper } = await import(
    "../utils/html-templates.js"
  );
  const content = renderAttendancePage(
    user, 
    professorCourses, 
    studentCourses, 
    studentHistory,
    {
      hasProfessorCourses,
      hasStudentCourses,
      hasAttendanceRecords,
    }
  );

  if (isHtmxRequest) {
    // For HTMX requests, wrap content with header and content-canvas structure
    const wrappedContent = createMainContentWrapper(
      "Attendance",
      content,
      {
        user: req.user,
        breadcrumbPath: "Dashboard / Attendance",
      },
    );
    res.send(wrappedContent);
  } else {
    // For direct navigation, use createBaseLayout
    const fullPage = createBaseLayout("Attendance", content, { user });
    res.send(fullPage);
  }
});
