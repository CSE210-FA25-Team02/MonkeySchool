import { Router } from "express";
import { requireAuth } from "../middleware/auth.js"; //Use to restrict routes to logged-in users
import * as activityController from "../controllers/activity.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// HTMX
router.get(
  "/user/dropdown",
  requireAuth,
  asyncHandler(activityController.getActivityDropdown),
);
router.get("/details", asyncHandler(activityController.getActivityDetails));
router.get(
  "/user/render",
  requireAuth,
  asyncHandler(activityController.renderPunchCard),
);
router.get(
  "/new-modal",
  requireAuth,
  asyncHandler(activityController.renderActivityModal),
);
router.get(
  "/edit-modal",
  requireAuth,
  asyncHandler(activityController.renderEditModal),
);
router.get(
  "/close-form",
  requireAuth,
  asyncHandler(activityController.closeActivityPunchForm),
);
router.get(
  "/load-fields",
  requireAuth,
  asyncHandler(activityController.loadActivityFields),
);

// CRUD
router.post("/", requireAuth, asyncHandler(activityController.createActivity));
router.get("/user", requireAuth, asyncHandler(activityController.getActivitiesByUser));
router.get("/:id", requireAuth, asyncHandler(activityController.getActivity));
router.put("/:id", requireAuth, asyncHandler(activityController.updateActivity));
router.delete("/:id", requireAuth, asyncHandler(activityController.deleteActivity));

export default router;
