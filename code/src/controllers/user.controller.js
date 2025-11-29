/**
 * User Controller
 * code/src/controllers/user.controller.js
 */

import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import {
  createBaseLayout,
  createSuccessMessage,
} from "../utils/html-templates.js";
import { renderProfilePage } from "../utils/htmx-templates/profile-templates.js";

/**
 * Get user by ID (JSON API)
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) throw new NotFoundError("User not found");
  res.json(user);
});

/**
 * Load User Profile Page
 * Auth: requireAuth
 */
export const renderUserProfilePage = asyncHandler(async (req, res) => {
  const isHtmx = !!req.headers["hx-request"];

  // User is guaranteed by requireAuth middleware
  let user = req.user;

  // Try to fetch full user data from database
  try {
    const dbUser = await userService.getUserById(user.id);
    if (dbUser) user = dbUser;
  } catch (e) {
    console.log("Using auth user due to DB error:", e.message);
    // Use dummy data if database fails
    user = {
      id: user.id || "dummy-id",
      email: user.email || "user@ucsd.edu",
      name: user.name || "John Doe",
      pronouns: user.pronouns || "he/him",
      bio:
        user.bio ||
        "Software Engineering student at UCSD. Passionate about web development and bananas. 🐒",
      github: user.github || "john-doe",
      linkedin: user.linkedin || "john-doe",
      photoUrl: user.photoUrl || null,
    };
  }

  // Render profile page
  const content = renderProfilePage(user, []);

  if (isHtmx) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout("Profile", content, { user });
    res.send(fullPage);
  }
});

/**
 * Update User Profile
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  // eslint-disable-next-line no-unused-vars
  const userId = req.user.id;
  const { name, pronouns, bio, github } = req.body;

  // TODO: Backend integration - update user in database
  // For now, just return success and re-render profile
  const updatedUser = {
    ...req.user,
    name: name || req.user.name,
    pronouns,
    bio,
    github,
  };

  const content = renderProfilePage(updatedUser, []);
  const isHtmx = !!req.headers["hx-request"];

  if (isHtmx) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout("Profile", content, {
      user: updatedUser,
    });
    res.send(fullPage);
  }
});

/**
 * Update User Settings (preferences)
 */
export const updateUserSettings = asyncHandler(async (req, res) => {
  // TODO: Backend integration - save settings
  // For now, just return success message
  res.send(createSuccessMessage("Preferences saved successfully!"));
});
