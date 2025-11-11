import { Router } from "express";
import * as classController from "../controllers/class.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorize.js";

const router = Router({ mergeParams: true });

// Invite lookup must come before /:id
router.get("/invite/:code", asyncHandler(classController.getClassByInviteCode));

// CRUD
router.post(
  "/",
  asyncHandler(requireAuth),
  requireRole("class", ["PROFESSOR"]),
  asyncHandler(classController.createClass)
);
router.get(
  "/:id",
  asyncHandler(requireAuth),
  requireRole("class", ["PROFESSOR", "TA", "TUTOR", "STUDENT"]),
  asyncHandler(classController.getClass)
);
router.put(
  "/:id",
  asyncHandler(requireAuth),
  requireRole("class", ["PROFESSOR", "TA"]),
  asyncHandler(classController.updateClass)
);
router.delete(
  "/:id",
  asyncHandler(requireAuth),
  requireRole("class", ["PROFESSOR"]),
  asyncHandler(classController.deleteClass)
);

export default router;