import {
  Router
} from "express";
import * as classController from "../controllers/class.controller.js";
import {
  asyncHandler
} from "../utils/async-handler.js";
import {
  requireAuth
} from "../middleware/auth.js";
import {
  requireRole
} from "../middleware/authorize.js";

const router = Router({
  mergeParams: true
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

// Class Detail Page
router.get(
  "/:id",
  requireAuth,
  asyncHandler(classController.renderClassPage),
);

// Class Directory (HTMX partial)
router.get(
  "/:id/directory",
  requireAuth,
  asyncHandler(classController.renderClassDirectory),
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
// CRUD OPERATIONS (require auth)
// ============================================

router.post("/create", requireAuth, asyncHandler(classController.createClass));

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