import { Router } from "express";
import * as classRoleController from "../controllers/classRole.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router({ mergeParams: true });

router.post("/assign", asyncHandler(classRoleController.assignRole));
router.post("/remove", asyncHandler(classRoleController.removeRole));
router.get("/:classId/roster", asyncHandler(classRoleController.getRoster));

export default router;
