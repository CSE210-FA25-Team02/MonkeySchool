/**
 * Routes Index
 *
 * Aggregates and exports all application routes
 */

// code/src/routes/index.js

import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./user.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import classRoutes from "./class.routes.js";
import classRoleRoutes from "./classRole.routes.js";
import authRoutes from "./auth.routes.js";
import activityRoutes from "./activity.routes.js";
import courseSessionRoutes from "./courseSession.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import availabilityRoutes from "./availability.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import workJournalRoutes from "./workJournal.routes.js";
import chatRoutes from "./chat.routes.js";
import groupRoutes from "./group.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as classController from "../controllers/class.controller.js";
import * as attendanceController from "../controllers/attendance.controller.js";

const router = Router();

/**
 * Mount route modules
 */
// Serve login page (static file)
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
});

router.use("/", dashboardRoutes); // Dashboard route at root
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/classes", classRoutes);
router.use("/classRoles", classRoleRoutes);
router.use("/activity", activityRoutes);
router.use("/course-sessions", courseSessionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/availability", availabilityRoutes);
router.use("/work-journals", workJournalRoutes);
router.use("/chat", chatRoutes);
router.use("/groups", groupRoutes);
router.use("/", scheduleRoutes);
router.use("/:quarter/classes", classRoutes);
router.use("/:quarter/classRoles", classRoleRoutes);

// Top-level invite route for joining classes
// URL: /invite/XXXXXXXX
router.get(
  "/invite/:code",
  requireAuth,
  asyncHandler(classController.joinClassByInviteCode)
);

// Top-level attendance page routes
// Get new poll form (HTMX)
router.get(
  "/course/:courseId/session/:sessionId/poll/new",
  requireAuth,
  asyncHandler(attendanceController.getNewPollForm)
);

// Start poll (HTMX)
router.post(
  "/course/:courseId/session/:sessionId/poll/start",
  requireAuth,
  asyncHandler(attendanceController.startPoll)
);

// Session-wise attendance records page (professor only)
router.get(
  "/course/:courseId/session/:sessionId/records",
  requireAuth,
  asyncHandler(attendanceController.getSessionRecordsPage)
);

// Course-wise attendance records page (professor only)
router.get(
  "/course/:courseId/records",
  requireAuth,
  asyncHandler(attendanceController.getCourseRecordsPage)
);

// Student attendance records page for a specific course
router.get(
  "/course/:courseId/user/:userId/records",
  requireAuth,
  asyncHandler(attendanceController.getStudentCourseRecordsPage)
);

// API: Get courses for a user (where user is a student)
router.get(
  "/api/user/:userId/courses",
  requireAuth,
  asyncHandler(attendanceController.getUserCourses)
);

// API: Get attendance records for a student in a course (JSON)
router.get(
  "/api/course/:courseId/user/:userId/records",
  requireAuth,
  asyncHandler(attendanceController.getStudentCourseRecords)
);

// Redirect /courses/attendance to /attendance for backward compatibility
router.get(
  "/courses/attendance",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      // For HTMX, call the attendance page handler directly
      return attendanceController.getAttendancePage(req, res, next);
    } else {
      // For direct navigation, redirect
      res.redirect("/attendance");
    }
  })
);

export default router;
