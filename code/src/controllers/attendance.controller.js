// Attendance Controller
// code/src/controllers/attendance.controller.js

import * as attendancePollService from "../services/attendancePoll.service.js";
import * as attendanceRecordService from "../services/attendanceRecord.service.js";
import * as courseSessionService from "../services/courseSession.service.js";
import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/api-error.js";
import {
  createPollSchema,
  submitAttendanceSchema,
} from "../validators/attendance.validator.js";
import {
  createStartAttendanceModal,
  displayAttendanceCode,
  closeAttendanceModal,
} from "../utils/htmx-templates/attendance-templates.js";
import { env } from "../config/env.js";
import { escapeHtml } from "../utils/html-templates.js";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Create an attendance poll for a session
 * Auth: professor (must teach the class)
 */
export const createPoll = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

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
    // Return HTMX response with code display
    const codeHtml = displayAttendanceCode({
      code: poll.code,
      expiresAt: poll.expiresAt,
    });
    res.status(201).send(codeHtml);
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
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

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
    const record = await attendanceRecordService.submitAttendance(
      code,
      userId,
    );

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
 * Get attendance records for a session
 * Auth: professor (must teach the class) or admin
 */
export const getSessionAttendance = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

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
  const isAdmin = req.user?.isProf; // Simple admin check - adjust as needed
  if (!isProfessor && !isAdmin) {
    throw new ForbiddenError("Only professors can view session attendance");
  }

  // Get polls and attendance
  const polls = await attendancePollService.getPollsBySessionId(sessionId);
  const attendance = await attendanceRecordService.getSessionAttendance(
    sessionId,
  );

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    const { displaySessionAttendance } = await import(
      "../utils/htmx-templates/attendance-templates.js"
    );
    const data = {
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
        pollId: a.poll?.id,
        pollCode: a.poll?.code,
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
        pollId: a.poll?.id,
        pollCode: a.poll?.code,
      })),
    });
  }
});

/**
 * Get attendance summary for a course
 * Auth: professor (must teach the class) or admin
 */
export const getCourseAttendanceSummary = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { courseId } = req.params;

  // Check authorization
  const klass = await classService.getClassById(courseId);
  if (!klass) {
    throw new NotFoundError("Course not found");
  }

  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  const isAdmin = req.user?.isProf; // Simple admin check
  if (!isProfessor && !isAdmin) {
    throw new ForbiddenError("Only professors can view course attendance");
  }

  const summary = await attendanceRecordService.getCourseAttendanceSummary(
    courseId,
  );

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
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const isHtmxRequest = req.headers["hx-request"];
  
  if (isHtmxRequest) {
    // For HTMX requests, return grouped data with collapsible UI
    const { displayStudentAttendanceGrouped } = await import(
      "../utils/htmx-templates/attendance-templates.js"
    );
    const groupedAttendance = await attendanceRecordService.getStudentAttendanceGroupedByCourse(userId);
    const html = displayStudentAttendanceGrouped({
      studentId: userId,
      courses: groupedAttendance,
    });
    res.send(html);
  } else {
    // For JSON API requests, return flat list (backward compatibility)
    const attendance = await attendanceRecordService.getStudentAttendance(userId);
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
    return res.status(400).json({ error: "Session ID required" });
  }

  const defaultDuration = env.ATTENDANCE_DEFAULT_DURATION;
  const formHtml = createStartAttendanceModal(sessionId, defaultDuration);
  res.send(formHtml);
});

/**
 * Close attendance modal (HTMX)
 */
export const closeAttendanceModalHandler = asyncHandler(async (req, res) => {
  res.send(closeAttendanceModal());
});

/**
 * Close/deactivate a poll early
 * Auth: professor (must teach the class)
 */
export const closePoll = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { pollId } = req.params;

  // Get poll to find session - we need to get it via session service
  // First, get all polls for sessions and find the one we need
  // Actually, let's add a method to get poll by ID in the service
  // For now, let's get the session from the poll's sessionId
  // We'll need to modify the service or do a direct query here
  // Let me use a simpler approach - get session from pollId via a join
  const { prisma } = await import("../lib/prisma.js");
  const poll = await prisma.attendancePoll.findUnique({
    where: { id: pollId },
    include: {
      session: {
        include: {
          class: true,
        },
      },
    },
  });

  if (!poll) {
    throw new NotFoundError("Poll not found");
  }

  // Check authorization
  const klass = await classService.getClassById(poll.session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can close polls");
  }

  await attendancePollService.deactivatePoll(pollId);

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    // Redirect back to attendance page to refresh the view
    res.redirect("/attendance");
  } else {
    res.status(200).json({ success: true, message: "Poll closed" });
  }
});

/**
 * Get main attendance page
 * Shows different content based on user role (student vs professor)
 */
export const getAttendancePage = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const isHtmxRequest = req.headers["hx-request"];

  // Get user's classes to determine role
  const userClasses = await classService.getClassesByUserId(userId);
  const professorClasses = userClasses.filter((c) => c.role === "PROFESSOR");
  const isProfessor = professorClasses.length > 0;

  // Import templates
  const {
    createAttendanceCodeInput,
    displayStudentAttendance,
    createStartAttendanceButton,
    createSessionButton,
  } = await import("../utils/htmx-templates/attendance-templates.js");

  let html = "";

  if (isProfessor) {
    // For professors: show their classes with sessions where they can start polls
    if (professorClasses.length === 0) {
      html = `
        <div class="container">
          <section class="attendance-page" role="region" aria-labelledby="attendance-page-title">
            <h2 id="attendance-page-title" class="attendance-page__title">Attendance</h2>
            <p class="attendance-page__empty">You are not teaching any classes yet.</p>
          </section>
        </div>
      `;
    } else {
      // Get sessions for each class
      const classesWithSessions = await Promise.all(
        professorClasses.map(async (klass) => {
          const sessions = await courseSessionService.getSessionsByClassId(
            klass.id,
          );
          return { ...klass, sessions };
        }),
      );

      const classesHtml = classesWithSessions
        .map((klass) => {
          const sessionsHtml = klass.sessions
            .map((session) => {
              const hasActivePoll = session.attendancePolls.length > 0;
              const activePoll = session.attendancePolls[0];
              const sessionDate = new Date(session.date).toLocaleDateString();
              const startTime = session.startTime
                ? new Date(session.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return `
                <div class="attendance-session-item">
                  <div class="attendance-session-item__info">
                    <h4 class="attendance-session-item__name">${escapeHtml(
                      session.name,
                    )}</h4>
                    <p class="attendance-session-item__date">${sessionDate}${startTime ? ` at ${startTime}` : ""}</p>
                    ${hasActivePoll ? `
                      <p class="attendance-session-item__status">
                        <strong>Active Code:</strong> ${escapeHtml(activePoll.code)}
                        <br>
                        <small>Expires: ${new Date(activePoll.expiresAt).toLocaleString()}</small>
                      </p>
                    ` : ""}
                    <p class="attendance-session-item__count">
                      ${session._count.attendanceRecords} attendance record(s)
                    </p>
                  </div>
                  <div class="attendance-session-item__actions">
                    ${!hasActivePoll ? createStartAttendanceButton(session.id) : `
                      <button 
                        class="btn btn--secondary"
                        hx-patch="/api/attendance/poll/${activePoll.id}/close"
                        hx-target="#main-content"
                        hx-swap="outerHTML"
                      >
                        Close Poll
                      </button>
                    `}
                    <a 
                      href="/api/attendance/session/${session.id}"
                      class="btn btn--primary"
                      hx-get="/api/attendance/session/${session.id}"
                      hx-target="#main-content"
                      hx-push-url="true"
                    >
                      View Records
                    </a>
                  </div>
                </div>
              `;
            })
            .join("");

          return `
            <div class="attendance-class-section">
              <h3 class="attendance-class-section__title">${escapeHtml(klass.name)}</h3>
              ${klass.sessions.length === 0 ? `
                <div class="attendance-class-section__empty">
                  <p>No sessions yet. Create a session to start taking attendance.</p>
                  ${createSessionButton(klass.id)}
                </div>
              ` : `
                <div class="attendance-sessions">
                  ${sessionsHtml}
                </div>
              `}
              <div class="attendance-class-section__actions">
                ${klass.sessions.length > 0 ? createSessionButton(klass.id) : ""}
                <a 
                  href="/api/attendance/course/${klass.id}/summary"
                  class="btn btn--primary"
                  hx-get="/api/attendance/course/${klass.id}/summary"
                  hx-target="#main-content"
                  hx-push-url="true"
                >
                  View Attendance Summary
                </a>
              </div>
            </div>
          `;
        })
        .join("");

      html = `
        <div class="container">
          <section class="attendance-page" role="region" aria-labelledby="attendance-page-title">
            <h2 id="attendance-page-title" class="attendance-page__title">Attendance</h2>
            <div class="attendance-classes">
              ${classesHtml}
            </div>
            <div id="attendance-modal-container"></div>
          </section>
        </div>
      `;
    }
  } else {
    // For students: show code input form and attendance history
    const { displayStudentAttendanceGrouped } = await import(
      "../utils/htmx-templates/attendance-templates.js"
    );
    const groupedAttendance = await attendanceRecordService.getStudentAttendanceGroupedByCourse(
      userId,
    );
    const attendanceHistoryHtml = displayStudentAttendanceGrouped({
      studentId: userId,
      courses: groupedAttendance,
    });
    const codeInputHtml = createAttendanceCodeInput();

    html = `
      <div class="container">
        <section class="attendance-page" role="region" aria-labelledby="attendance-page-title">
          <h2 id="attendance-page-title" class="attendance-page__title">Attendance</h2>
          ${codeInputHtml}
          ${attendanceHistoryHtml}
        </section>
      </div>
    `;
  }

  // Always send HTML content wrapped in container
  // For HTMX requests, send just the content
  // For direct navigation, we need to serve the full page but the client should handle it
  if (isHtmxRequest) {
    res.send(html);
  } else {
    // For direct navigation, try to inject the content into index.html
    // Or just redirect to let HTMX handle it
    // Actually, let's serve the content directly wrapped properly
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const indexPath = path.join(__dirname, "..", "public", "index.html");
    const fs = await import("fs");
    const indexContent = await fs.promises.readFile(indexPath, "utf8");
    
    // Replace main content with our HTML
    const mainTagRegex = /(<main id="main-content"[^>]*>)([\s\S]*?)(<\/main>)/;
    const updatedHtml = indexContent.replace(
      mainTagRegex,
      (match, openingTag, oldContent, closingTag) => {
        return `${openingTag}${html}${closingTag}`;
      }
    );
    
    res.send(updatedHtml);
  }
});

