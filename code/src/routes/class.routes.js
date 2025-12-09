import { Router } from "express";
import * as classController from "../controllers/class.controller.js";
import * as pulseController from "../controllers/pulse.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = Router({
  mergeParams: true,
});

// ============================================
// PAGE ROUTES (require authentication)
// ============================================

// Classes Index - redirect to My Classes
router.get("/", (req, res) => {
  res.redirect("/classes/my-classes");
});

// My Classes Page
router.get(
  "/my-classes",
  requireAuth,
  asyncHandler(classController.renderUserClasses),
);

// ============================================
// PULSE ANALYTICS ROUTES (require auth, instructors only)
// These routes must come BEFORE student pulse routes to avoid conflicts
// ============================================

// Render pulse analytics page (instructor view)
router.get(
  "/:id/pulse/page",
  requireAuth,
  asyncHandler(pulseController.renderPulseAnalytics),
);

// Get pulse analytics data (JSON)
router.get(
  "/:id/pulse/analytics",
  requireAuth,
  asyncHandler(pulseController.getPulseAnalytics),
);

// Get pulse details for a specific date (JSON)
router.get(
  "/:id/pulse/details",
  requireAuth,
  asyncHandler(pulseController.getPulseDetails),
);

// ============================================
// PULSE CHECK ROUTES (require auth, students only)
// These routes must come BEFORE /:id route to avoid conflicts
// ============================================

// Submit or update pulse entry
router.post(
  "/:id/pulse",
  requireAuth,
  asyncHandler(pulseController.submitPulse),
);

// Get today's pulse entry
router.get("/:id/pulse", requireAuth, asyncHandler(pulseController.getPulse));

// Get today's pulse entry (alternative endpoint)
router.get(
  "/:id/pulse/today",
  requireAuth,
  asyncHandler(pulseController.getTodayPulse),
);

// Class Detail Page (must come after pulse routes)
router.get("/:id", requireAuth, asyncHandler(classController.renderClassPage));

// Class Directory (HTMX partial)
router.get(
  "/:id/directory",
  requireAuth,
  asyncHandler(classController.renderClassDirectory),
);

// Class Settings (HTMX partial)
router.get(
  "/:id/settings",
  requireAuth,
  asyncHandler(classController.renderClassSettings),
);

// ============================================
// FORM ROUTES
// ============================================

router.get(
  "/form",
  requireAuth,
  asyncHandler(classController.renderCreateClassForm),
);
router.get("/close-form", asyncHandler(classController.closeCreateClassForm));

// ============================================
// JSON API ROUTES
// ============================================

// Get user's classes (JSON)
router.get(
  "/user/classes",
  requireAuth,
  asyncHandler(classController.getUserClasses),
);

// Get class directory (JSON)
router.get(
  "/:id/directory/json",
  requireAuth,
  asyncHandler(classController.getClassDirectory),
);

// Invite lookup
router.get(
  "/invite/:code",
  requireAuth,
  asyncHandler(classController.getClassByInviteCode),
);

// ============================================
// EXTERNAL EMAIL MANAGEMENT (require auth)
// ============================================

// Add external email to class
router.post(
  "/:id/external-emails",
  requireAuth,
  asyncHandler(classController.addExternalEmail),
);

// Remove external email from class
router.delete(
  "/:id/external-emails/:email",
  requireAuth,
  asyncHandler(classController.removeExternalEmail),
);

// ============================================
// CRUD OPERATIONS (require auth)
// ============================================

router.post("/create", requireAuth, asyncHandler(classController.createClass));

router.post("/join", requireAuth, asyncHandler(classController.joinClass));

router.put(
  "/:id",
  requireAuth,
  (req, res, next) => {
    if (req.params.quarter) {
      return requireRole("class", ["PROFESSOR", "TA"])(req, res, next);
    }
    next();
  },
  asyncHandler(classController.updateClass),
);

router.delete(
  "/:id",
  requireAuth,
  (req, res, next) => {
    if (req.params.quarter) {
      return requireRole("class", ["PROFESSOR"])(req, res, next);
    }
    next();
  },
  asyncHandler(classController.deleteClass),
);

export default router;
