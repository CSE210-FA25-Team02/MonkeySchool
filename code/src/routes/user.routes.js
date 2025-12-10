import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Profile Page
router.get(
  "/profile",
  requireAuth,
  asyncHandler(userController.renderUserProfilePage),
);

// View Another User's Profile Page by ID
router.get(
  "/:id/profile",
  requireAuth,
  asyncHandler(userController.renderUserProfilePageById),
);

// Profile link field (legacy main-branch endpoint)
router.get(
  "/profile/link-field",
  requireAuth,
  asyncHandler(userController.renderProfileLinkField),
);

// Update Profile
router.put(
  "/profile",
  requireAuth,
  asyncHandler(userController.updateUserProfile),
);

// Update Settings
router.post(
  "/settings",
  requireAuth,
  asyncHandler(userController.updateUserSettings),
);

// JSON API
router.post("/", asyncHandler(userController.createUser));
router.put("/:id", asyncHandler(userController.updateUser));
router.delete("/:id", asyncHandler(userController.deleteUser));
router.get("/:id", asyncHandler(userController.getUser));

export default router;
