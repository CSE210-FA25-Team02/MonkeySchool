import { Router } from "express";
import * as classController from "../controllers/class.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// Invite lookup must come before /:id
router.get("/invite/:code", asyncHandler(classController.getClassByInviteCode));

// Class Create Form
router.get("/form", asyncHandler(classController.renderCreateClassForm));
router.get("/close-form", asyncHandler(classController.closeCreateClassForm));

// Classes Page
router.get("/", asyncHandler(classController.renderClassPage));

// CRUD
router.post("/create", asyncHandler(classController.createClass));
router.get("/:id", asyncHandler(classController.getClass));
router.put("/:id", asyncHandler(classController.updateClass));
router.delete("/:id", asyncHandler(classController.deleteClass));

export default router;
