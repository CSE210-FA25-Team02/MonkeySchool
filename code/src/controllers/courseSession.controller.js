// CourseSession Controller
// code/src/controllers/courseSession.controller.js

import * as courseSessionService from "../services/courseSession.service.js";
import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError, ForbiddenError } from "../utils/api-error.js";
import { createCourseSessionSchema } from "../validators/attendance.validator.js";

/**
 * Create a new course session
 * Auth: professor (must teach the class)
 */
export const createCourseSession = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Handle form data - combine date and time strings into ISO datetime strings
  // CRITICAL: Zod's z.coerce.date() expects strings/numbers, NOT Date objects
  // Empty strings should be removed (undefined) so .optional() works correctly
  let body = { ...req.body };

  // Convert date to string if it's a Date object
  let dateStr = null;
  if (body.date) {
    if (body.date instanceof Date) {
      dateStr = body.date.toISOString().split("T")[0];
      body.date = dateStr;
    } else if (typeof body.date === "string" && body.date.trim()) {
      dateStr = body.date.trim();
      body.date = dateStr;
    } else {
      dateStr = String(body.date);
      body.date = dateStr;
    }
  }

  // Handle startTime - remove if empty, convert Date objects to ISO strings, combine with date if needed
  if (body.startTime) {
    // If it's an empty string, remove it so .optional() handles it correctly
    if (typeof body.startTime === "string" && !body.startTime.trim()) {
      delete body.startTime;
    } else if (body.startTime instanceof Date) {
      // Already a Date object - convert to ISO string
      body.startTime = body.startTime.toISOString();
    } else if (typeof body.startTime === "string" && body.startTime.trim()) {
      const timeStr = body.startTime.trim();
      // Check if it's just a time (HH:MM) and needs date combination
      if (dateStr && timeStr.match(/^\d{2}:\d{2}$/)) {
        body.startTime = `${dateStr}T${timeStr}`;
      } else {
        // It's already an ISO datetime string - leave it as is
        body.startTime = timeStr;
      }
    } else if (body.startTime) {
      // Convert to string if not empty
      body.startTime = String(body.startTime);
    }
  } else if (body.startTime === "") {
    // Explicitly handle empty string
    delete body.startTime;
  }

  // Handle endTime - remove if empty, convert Date objects to ISO strings, combine with date if needed
  if (body.endTime) {
    // If it's an empty string, remove it so .optional() handles it correctly
    if (typeof body.endTime === "string" && !body.endTime.trim()) {
      delete body.endTime;
    } else if (body.endTime instanceof Date) {
      // Already a Date object - convert to ISO string
      body.endTime = body.endTime.toISOString();
    } else if (typeof body.endTime === "string" && body.endTime.trim()) {
      const timeStr = body.endTime.trim();
      // Check if it's just a time (HH:MM) and needs date combination
      if (dateStr && timeStr.match(/^\d{2}:\d{2}$/)) {
        body.endTime = `${dateStr}T${timeStr}`;
      } else {
        // It's already an ISO datetime string - leave it as is
        body.endTime = timeStr;
      }
    } else if (body.endTime) {
      // Convert to string if not empty
      body.endTime = String(body.endTime);
    }
  } else if (body.endTime === "") {
    // Explicitly handle empty string
    delete body.endTime;
  }

  // Validate input
  const validation = createCourseSessionSchema.safeParse(body);
  if (!validation.success) {
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // Return error message for HTMX
      return res.status(400).send(`
        <div class="alert alert--error">
          <h3>Validation Error</h3>
          <p>${JSON.stringify(validation.error.flatten().fieldErrors)}</p>
        </div>
      `);
    }
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    });
  }

  const { classId, name, date, startTime, endTime } = validation.data;

  // Check if user is professor of the class
  const klass = await classService.getClassById(classId);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR"
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can create sessions");
  }

  // Create session
  const session = await courseSessionService.createCourseSession({
    classId,
    name,
    date,
    startTime,
    endTime,
  });

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    // Use HX-Redirect header for HTMX to handle redirect properly
    // This allows the modal to close before the redirect happens
    res.status(200).header("HX-Redirect", "/attendance").send("");
  } else {
    res.status(201).json(session);
  }
});

/**
 * Get a course session by ID
 */
export const getCourseSession = asyncHandler(async (req, res) => {
  const session = await courseSessionService.getCourseSessionById(
    req.params.id
  );
  if (!session) {
    throw new NotFoundError("Session not found");
  }
  res.json(session);
});

/**
 * Get all sessions for a class
 */
export const getSessionsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const sessions = await courseSessionService.getSessionsByClassId(classId);
  res.json(sessions);
});

/**
 * Get today's sessions for a class
 */
export const getTodaySessions = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const today = new Date();
  const sessions = await courseSessionService.getSessionsByClassIdAndDate(
    classId,
    today
  );
  res.json(sessions);
});

/**
 * Update a course session
 */
export const updateCourseSession = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Get session to check ownership
  const session = await courseSessionService.getCourseSessionById(
    req.params.id
  );
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check if user is professor
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR"
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can update sessions");
  }

  const validation = createCourseSessionSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    });
  }

  const updated = await courseSessionService.updateCourseSession(
    req.params.id,
    validation.data
  );
  res.json(updated);
});

/**
 * Delete a course session
 */
export const deleteCourseSession = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const session = await courseSessionService.getCourseSessionById(
    req.params.id
  );
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check if user is professor
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR"
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can delete sessions");
  }

  await courseSessionService.deleteCourseSession(req.params.id);
  res.status(204).send();
});

/**
 * Get session creation form (HTMX)
 */
export const getSessionForm = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { classId } = req.query;
  if (!classId) {
    return res.status(400).json({ error: "Class ID required" });
  }

  // Check if user is professor of the class
  const klass = await classService.getClassById(classId);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR"
  );
  if (!isProfessor) {
    throw new ForbiddenError("Only professors can create sessions");
  }

  const { createSessionForm } = await import(
    "../utils/htmx-templates/attendance-templates.js"
  );
  const formHtml = createSessionForm(classId);
  res.send(formHtml);
});
