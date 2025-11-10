import {
    Router
} from "express";
import * as classController from "../controllers/class.controller.js";
import {
    asyncHandler
} from "../utils/async-handler.js";
import {
    requireAuth,
    optionalAuth
} from "../middleware/auth.js";

const router = Router();

// HTML page route for HTMX (uses optionalAuth to check if user is logged in)
router.get("/my-classes", optionalAuth, asyncHandler(classController.renderUserClasses));

// JSON API route for programmatic access (requires authentication)
router.get("/user/classes", requireAuth, asyncHandler(classController.getUserClasses));

// Invite lookup must come before /:id
router.get("/invite/:code", asyncHandler(classController.getClassByInviteCode));

// CRUD
router.post("/", asyncHandler(classController.createClass));
router.get("/:id", asyncHandler(classController.getClass));
router.put("/:id", asyncHandler(classController.updateClass));
router.delete("/:id", asyncHandler(classController.deleteClass));

export default router;