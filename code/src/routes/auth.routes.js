/**
 * Authentication Routes
 *
 * Handles OAuth login, callback, logout, and session endpoints
 */

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// OAuth login initiation
router.get("/login", asyncHandler(authController.login));

// OAuth callback
router.get("/callback", asyncHandler(authController.callback));

// Logout
router.get("/logout", asyncHandler(authController.logout));

// Get current session
router.get("/session", asyncHandler(authController.getSession));

export default router;
