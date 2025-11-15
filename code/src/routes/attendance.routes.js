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

// Close attendance modal (HTMX)
router.get(
  "/close-modal",
  asyncHandler(attendanceController.closeAttendanceModalHandler),
);

// Create an attendance poll (professor only)
router.post(
  "/poll/create",
  asyncHandler(attendanceController.createPoll),
);

// Submit attendance using a code (student only)
router.post(
  "/submit",
  submitRateLimiter,
  asyncHandler(attendanceController.submitAttendance),
);

// Get attendance records for a session (professor only)
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

// Close/deactivate a poll early (professor only)
router.patch(
  "/poll/:pollId/close",
  asyncHandler(attendanceController.closePoll),
);

export default router;

