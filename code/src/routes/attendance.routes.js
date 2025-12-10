// Attendance Routes
// code/src/routes/attendance.routes.js

import { Router } from "express";
import * as attendanceController from "../controllers/attendance.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter for attendance submission to prevent brute-forcing codes
const submitRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many attendance submission attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(requireAuth);

// Get attendance poll form (HTMX)
router.get(
  "/poll/form",
  asyncHandler(attendanceController.getAttendancePollForm),
);

// Create an attendance poll (professor only)
router.post("/poll/create", asyncHandler(attendanceController.createPoll));

// Mark attendance with course selection (student only, HTMX)
router.post(
  "/mark",
  submitRateLimiter,
  asyncHandler(attendanceController.markAttendance),
);

// Attendance page route
router.get("/", asyncHandler(attendanceController.getAttendancePage));

// Legacy route for backward compatibility
router.get(
  "/course/session/:sessionId/records",
  asyncHandler(attendanceController.getSessionRecordsPage),
);

// Legacy route for backward compatibility
router.get(
  "/course/:courseId/records",
  asyncHandler(attendanceController.getCourseRecordsPage),
);

// Get attendance records for a session (professor only) - legacy endpoint
router.get(
  "/session/:sessionId",
  asyncHandler(attendanceController.getSessionAttendance),
);

// Get attendance summary for a course (professor only)
router.get(
  "/course/:courseId/summary",
  asyncHandler(attendanceController.getCourseAttendanceSummary),
);

// Get student's personal attendance history
router.get(
  "/student/me",
  asyncHandler(attendanceController.getStudentAttendance),
);

// Get code status for a session (HTMX polling)
router.get(
  "/session/:sessionId/code-status",
  asyncHandler(attendanceController.getSessionCodeStatus),
);

// Toggle course pane (for collapsible course sections)
router.get(
  "/course/:courseId/toggle",
  asyncHandler(attendanceController.toggleCoursePane),
);

export default router;
