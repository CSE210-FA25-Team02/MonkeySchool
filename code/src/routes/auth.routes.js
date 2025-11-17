/**
 * Authentication Routes
 *
 * Handles OAuth login, callback, logout, and session endpoints
 */

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { generateToken } from "../services/auth.service.js";

const router = Router();

// OAuth login initiation
router.get("/login", asyncHandler(authController.login));

// OAuth callback
router.get("/callback", asyncHandler(authController.callback));

// Logout
router.get("/logout", asyncHandler(authController.logout));

// Get current session
router.get("/session", asyncHandler(authController.getSession));

// 🔥 Developer-only: Fake login without Google OAuth
router.get("/fake-login", (req, res) => {
  const fakeUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
  };

  const token = generateToken(fakeUser);

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: false, // true only in HTTPS
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.log("⚠️ Fake login activated. Logged in as test user.");

  res.redirect("/");
});


export default router;

