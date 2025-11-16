import { Router } from "express";
import * as activityController from "../controllers/activity.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// HTMX
router.get("/user/:userId/dropdown", asyncHandler(activityController.getActivityDropdown));
router.get("/details", asyncHandler(activityController.getActivityDetails));
router.get("/user/:userId/render", asyncHandler(activityController.renderPunchCard));


// CRUD
router.post("/", asyncHandler(activityController.createActivity));
router.get("/user/:userId", asyncHandler(activityController.getActivitiesByUser));
router.get("/:id", asyncHandler(activityController.getActivity));
router.put("/:id", asyncHandler(activityController.updateActivity));
router.delete("/:id", asyncHandler(activityController.deleteActivity));

export default router;
