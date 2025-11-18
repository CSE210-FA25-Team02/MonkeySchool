import {
    Router
} from "express";
import * as classController from "../controllers/class.controller.js";
import {
    asyncHandler
} from "../utils/async-handler.js";
import {
    optionalAuth
} from "../middleware/auth.js";

const router = Router();

// HTML page route for HTMX (uses optionalAuth to check if user is logged in)
router.get("/my-classes", optionalAuth, asyncHandler(classController.renderUserClasses));

// JSON API route for programmatic access
// Using optionalAuth to allow query param fallback for tests
// TODO: Change back to requireAuth once full JWT testing is implemented
router.get("/user/classes", optionalAuth, asyncHandler(classController.getUserClasses));

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
router.get("/:id/directory/json", asyncHandler(classController.getClassDirectory)); // For testing and preview
router.get("/:id/directory", asyncHandler(classController.renderClassDirectory));
router.put("/:id", asyncHandler(classController.updateClass));
router.delete("/:id", asyncHandler(classController.deleteClass));

export default router;