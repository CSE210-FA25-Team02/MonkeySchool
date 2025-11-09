import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/google", asyncHandler(authController.initiateGoogleAuth));
router.get("/google/callback", asyncHandler(authController.handleGoogleCallback));
router.post("/verify-token", asyncHandler(authController.verifyGoogleToken));
router.get("/me", authenticate, asyncHandler(authController.getCurrentUser));
router.get("/logout", asyncHandler(authController.logout));
router.post("/logout", asyncHandler(authController.logout));

export default router;

