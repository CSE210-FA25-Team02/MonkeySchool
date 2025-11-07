import { Router } from "express";
import * as classController from "../controllers/class.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// Invite lookup must come before /:id
router.get("/invite/:code", asyncHandler(classController.getClassByInviteCode));

// CRUD
router.post("/", asyncHandler(classController.createClass));
router.get("/:id", asyncHandler(classController.getClass));
router.put("/:id", asyncHandler(classController.updateClass));
router.delete("/:id", asyncHandler(classController.deleteClass));

export default router;
