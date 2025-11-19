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

  // Handle form data - combine date and time strings into Date objects
  let body = req.body;
  
  // Combine date and startTime if both are provided and startTime is not empty
  if (body.date && body.startTime && typeof body.startTime === 'string' && body.startTime.trim() !== '') {
    const dateStr = typeof body.date === 'string' ? body.date : body.date.toISOString().split('T')[0];
    body.startTime = `${dateStr}T${body.startTime}`;
  } else if (body.startTime === '' || (typeof body.startTime === 'string' && body.startTime.trim() === '')) {
    // Remove empty startTime so it's treated as undefined/optional
    delete body.startTime;
  }
  
  // Combine date and endTime if both are provided and endTime is not empty
  if (body.date && body.endTime && typeof body.endTime === 'string' && body.endTime.trim() !== '') {
    const dateStr = typeof body.date === 'string' ? body.date : body.date.toISOString().split('T')[0];
    body.endTime = `${dateStr}T${body.endTime}`;
  } else if (body.endTime === '' || (typeof body.endTime === 'string' && body.endTime.trim() === '')) {
    // Remove empty endTime so it's treated as undefined/optional
    delete body.endTime;
  }

  // Validate input (Zod will coerce strings to dates)
  const validation = createCourseSessionSchema.safeParse(body);
  if (!validation.success) {
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // Return error message for HTMX - show in modal
      const errorDetails = validation.error.flatten().fieldErrors;
      const errorMessages = Object.entries(errorDetails)
        .map(([field, errors]) => `${field}: ${errors.join(", ")}`)
        .join("; ");
      return res.status(400).send(`
        <div class="alert alert--error" style="margin: 1rem 0; padding: 1rem;">
          <h3>Validation Error</h3>
          <p>${errorMessages || "Please check your input and try again."}</p>
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
    (member) => member.userId === userId && member.role === "PROFESSOR",
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
    // For HTMX, redirect to attendance page to show the new session
    // HTMX will handle the redirect and update the page
    res.status(201).header("HX-Redirect", "/attendance").send("");
  } else {
    res.status(201).json(session);
  }
});

/**
 * Get a course session by ID
 */
export const getCourseSession = asyncHandler(async (req, res) => {
  const session = await courseSessionService.getCourseSessionById(
    req.params.id,
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
    today,
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
    req.params.id,
  );
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check if user is professor
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
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
    validation.data,
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
    req.params.id,
  );
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Check if user is professor
  const klass = await classService.getClassById(session.classId);
  const isProfessor = klass.members.some(
    (member) => member.userId === userId && member.role === "PROFESSOR",
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
    (member) => member.userId === userId && member.role === "PROFESSOR",
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

