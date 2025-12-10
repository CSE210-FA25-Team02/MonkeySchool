// CourseSession Routes
// code/src/routes/courseSession.routes.js

import { Router } from "express";
import * as courseSessionController from "../controllers/courseSession.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create a new course session
router.post(
  "/",
  requireAuth,
  asyncHandler(courseSessionController.createCourseSession),
);

// GET /course-sessions is not supported - return 404
router.get("/", (req, res) => {
  res.status(404).json({
    error:
      "Not found. Use /course-sessions/class/:classId to get sessions for a class.",
  });
});

// Get all sessions for a class
router.get(
  "/class/:classId",
  asyncHandler(courseSessionController.getSessionsByClass),
);

// Get today's sessions for a class
router.get(
  "/class/:classId/today",
  asyncHandler(courseSessionController.getTodaySessions),
);

// Get session creation form (HTMX)
router.get("/form", asyncHandler(courseSessionController.getSessionForm));

// Get a specific session
router.get("/:id", asyncHandler(courseSessionController.getCourseSession));

// Update a session
router.put("/:id", asyncHandler(courseSessionController.updateCourseSession));

// Delete a session
router.delete(
  "/:id",
  asyncHandler(courseSessionController.deleteCourseSession),
);

export default router;
