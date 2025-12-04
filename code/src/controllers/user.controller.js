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
 * Create user (JSON API)
 * Used by legacy tests and backend tools.
 */
export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

/**
 * Update user (JSON API)
 * Only updates fields provided in the request body.
 */
export const updateUser = asyncHandler(async (req, res) => {
  const updated = await userService.updateUser(req.params.id, req.body);
  res.json(updated);
});

/**
 * Delete user (JSON API)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
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
 * Load Profile Page Link Fields (used by main branch UI)
 * Currently returns a simple dummy input block for social/chat links.
 */
export const renderProfileLinkField = asyncHandler(async (req, res) => {
  const { type } = req.query;

  if (!["social", "chat"].includes(type)) {
    res.status(400).send("Invalid link type");
    return;
  }

  // Minimal HTML used by legacy UI – kept for compatibility with main branch.
  const label = type === "social" ? "Social link URL" : "Chat handle";

  const html = `
    <div class="form-group">
      <label class="form-label">${label}</label>
      <input
        type="text"
        class="form-input"
        name="${type}Links[]"
        placeholder="https://example.com/..."
      />
    </div>
  `;

  res.send(html);
});

/**
 * Update User Settings (preferences)
 */
export const updateUserSettings = asyncHandler(async (req, res) => {
  // TODO: Backend integration - save settings
  // For now, just return success message
  res.send(createSuccessMessage("Preferences saved successfully!"));
});
