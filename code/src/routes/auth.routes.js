import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateCsrf } from "../middleware/csrf.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// OAuth routes don't need CSRF (external redirects)
router.get("/google", asyncHandler(authController.initiateGoogleAuth));
router.get("/google/callback", asyncHandler(authController.handleGoogleCallback));

// Token verification doesn't need CSRF (handled by OAuth provider)
router.post("/verify-token", asyncHandler(authController.verifyGoogleToken));

// Protected routes
router.get("/me", authenticate, asyncHandler(authController.getCurrentUser));

// Logout routes - POST needs CSRF, GET doesn't (idempotent)
router.get("/logout", asyncHandler(authController.logout));
router.post("/logout", validateCsrf, asyncHandler(authController.logout));

export default router;

