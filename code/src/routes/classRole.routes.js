import { Router } from "express";
import * as classRoleController from "../controllers/classRole.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

// Change member role (Professor only)
router.put(
  "/:classId/members/:userId/role",
  requireAuth,
  asyncHandler(classRoleController.changeMemberRole)
);

export default router;
