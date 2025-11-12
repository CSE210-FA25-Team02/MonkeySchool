import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import {
  createBaseLayout,
  createErrorMessage,
  createSuccessMessage,
} from "../utils/html-templates.js";
import {
  createUserProfile,
  createProfileLinkField,
} from "../utils/components/profile-page.js";

/**
 * Get user by ID
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) throw new NotFoundError("User not found");
  res.json(user);
});

/**
 * Load User Profile Page
 */
export const renderUserProfilePage = asyncHandler(async (req, res) => {
  const isHtmx = !!req.headers["hx-request"];
  const mode = req.query.mode === "edit" ? "edit" : "view";

  try {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundError("User not authenticated");
    const user = await userService.getUserById(userId);
    if (!user) throw new NotFoundError("User not found");

    const profileHtml = createUserProfile(user, { mode });
    const html = isHtmx
      ? profileHtml
      : createBaseLayout(`${user.name} - Profile`, profileHtml);

    res.send(html);
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      status === 404 ? "User not found." : "Failed to load user profile.";

    const errorHtml = createErrorMessage(message);
    const html = isHtmx
      ? errorHtml
      : createBaseLayout("Error - Profile", errorHtml);

    res.status(status).send(html);
  }
});

/**
 * Create user
 */
export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

/**
 * Update user profile
 */
export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  const isHtmx = !!req.headers["hx-request"];

  if (isHtmx) {
    const html =
      createSuccessMessage("Profile updated successfully.") +
      createUserProfile(updatedUser, { mode: "view" });
    res.set("HX-Push", `/users/profile`);
    res.send(html);
  } else {
    res.json(updatedUser);
  }
});

/**
 * Load Profile Page Link Fields
 */
export const renderProfileLinkField = asyncHandler(async (req, res) => {
  const { type } = req.query;

  if (!["social", "chat"].includes(type)) {
    res.status(400).send("Invalid link type");
    return;
  }

  // Optionally, you could check req.user here if needed for context
  const html = createProfileLinkField("", { type });
  res.send(html);
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});
