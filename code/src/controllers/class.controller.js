/**
 * ============================================================================
 * Class Controller
 * ============================================================================
 *
 * File: code/src/controllers/class.controller.js
 *
 * This controller handles all class-related routes including:
 * - Rendering class list page (My Classes)
 * - Rendering class detail page with directory
 * - CRUD operations for classes
 *
 * BACKEND DATA FLOW:
 * - Frontend templates are in: utils/htmx-templates/classes-templates.js
 * - Real data comes from: services/class.service.js
 *
 * ============================================================================
 */

import * as classService from "../services/class.service.js";
import * as classRoleService from "../services/classRole.service.js";
import {
  getUpcomingQuarters,
  createBaseLayout,
} from "../utils/html-templates.js";
import {
  createClassForm,
  displayInvite,
  renderClassList,
  renderClassDirectory as renderDirectoryTemplate,
  renderClassDetail,
} from "../utils/htmx-templates/classes-templates.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";

// ============================================================================
// PAGE ROUTES - These render full HTML pages
// ============================================================================

/**
 * Render My Classes Page
 *
 * Route: GET /classes/my-classes
 * Auth: requireAuth
 */
export const renderUserClasses = asyncHandler(async (req, res) => {
  // User is guaranteed by requireAuth middleware
  const user = req.user;
  const userId = user.id;

  // Fetch classes from backend
  const classes = await classService.getClassesByUserId(userId);

  // Render page
  const content = renderClassList(classes);

  // Check if HTMX request (partial) or full page request
  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout("My Classes", content, { user });
    res.send(fullPage);
  }
});

/**
 * Render Class Detail Page
 *
 * Route: GET /classes/:id
 * Auth: requireAuth
 */
export const renderClassPage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Fetch class info
  const klass = await classService.getClassById(id);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Fetch class directory
  const directory = await classService.getClassDirectory(id);
  if (directory) {
    directory.class = klass;
  }

  // Class Information
  const studentCount = klass.members.filter((m) => m.role === "STUDENT").length;

  const classInfo = {
    ...klass,
    studentCount,
  };

  // Render page
  const content = renderDirectoryTemplate(
    directory || {
      class: klass,
      professors: [],
      tas: [],
      tutors: [],
      groups: [],
    },
  );
  const pageHtml = renderClassDetail(classInfo, "directory", content);

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    res.send(pageHtml);
  } else {
    const fullPage = createBaseLayout(klass.name, pageHtml, { user: req.user });
    res.send(fullPage);
  }
});

/**
 * Render Class Directory (HTMX Partial)
 *
 * Route: GET /classes/:id/directory
 * Used for: Tab switching in class detail page
 */
export const renderClassDirectory = asyncHandler(async (req, res) => {
  const directory = await classService.getClassDirectory(req.params.id);
  const content = renderDirectoryTemplate(
    directory || {
      professors: [],
      tas: [],
      tutors: [],
      groups: [],
    },
  );
  res.send(content);
});

// ============================================================================
// API ROUTES - These return JSON for programmatic access
// ============================================================================

/**
 * Get Class by ID (JSON)
 * Route: GET /classes/:id (with Accept: application/json)
 */
export const getClass = asyncHandler(async (req, res) => {
  const klass = await classService.getClassById(req.params.id);
  if (!klass) throw new NotFoundError("Class not found");
  res.status(200).json(klass);
});

/**
 * Get Class Directory (JSON)
 * Route: GET /classes/:id/directory/json
 */
export const getClassDirectory = asyncHandler(async (req, res) => {
  const directory = await classService.getClassDirectory(req.params.id);
  if (!directory) throw new NotFoundError("Class not found");
  res.json(directory);
});

/**
 * Get User's Classes (JSON)
 * Route: GET /classes/user/classes
 */
export const getUserClasses = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const classes = await classService.getClassesByUserId(userId);
  res.status(200).json(classes);
});

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a New Class
 * Route: POST /classes/create
 * Auth: requireAuth
 *
 * NOTE: For demo purposes, any authenticated user can create a class.
 * TODO: In production, restrict to isProf === true
 */
export const createClass = asyncHandler(async (req, res) => {
  const { name, quarter, location } = req.body;
  const userId = req.user.id;

  // TODO: Uncomment for production to restrict to professors only
  // const isProf = req.user.isProf === true;
  // if (!isProf) {
  //   return res.status(401).send("Unauthorized to create class.");
  // }

  if (!name || name.trim().length === 0) {
    return res.status(400).send("Class name is required.");
  }

  let klass;
  try {
    klass = await classService.createClass({
      name,
      quarter,
      location,
    });
  } catch (err) {
    console.error("Error creating class:", err);
    return res.status(500).send("Failed to create class. Try again.");
  }

  // Assign professor to class
  try {
    await classRoleService.upsertClassRole({
      userId,
      classId: klass.id,
      role: "PROFESSOR",
    });
  } catch (err) {
    console.error("Unable to assign professor to class:", err);
  }

  const inviteUrl = `${req.protocol}://${req.get("host")}/invite/${klass.inviteCode}`;
  const isHTMX = req.headers["hx-request"];

  if (isHTMX) {
    res.status(201).send(displayInvite(inviteUrl));
  } else {
    res.status(201).json(klass);
  }
});

/**
 * Get Class by Invite Code (JSON API)
 * Route: GET /classes/invite/:code
 */
export const getClassByInviteCode = asyncHandler(async (req, res) => {
  const klass = await classService.getClassByInviteCode(req.params.code);
  if (!klass) throw new NotFoundError("Class not found");

  const userId = req.user.id;

  // Add user to class as student
  try {
    await classRoleService.upsertClassRole({
      userId,
      classId: klass.id,
      role: "STUDENT",
    });
  } catch (err) {
    console.error("Unable to assign user to class:", err);
  }

  res.status(200).json(klass);
});

/**
 * Join Class by Invite Code (Page Route)
 * Route: GET /invite/:code
 *
 * This is the top-level invite route that students use to join a class.
 * It adds the user as a STUDENT and redirects to the class page.
 */
export const joinClassByInviteCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const userId = req.user.id;

  // Find class by invite code
  const klass = await classService.getClassByInviteCode(code);
  if (!klass) {
    // Show error page
    const errorHtml = createBaseLayout(
      "Invalid Invite",
      `
      <div style="text-align: center; padding: 48px;">
        <div style="font-size: 64px; margin-bottom: 16px; color: var(--color-status-error);">
          <i class="fa-solid fa-circle-xmark"></i>
        </div>
        <h2 style="margin-bottom: 8px;">Invalid Invite Code</h2>
        <p style="color: var(--color-text-muted); margin-bottom: 24px;">
          The invite code "${code}" is not valid or has expired.
        </p>
        <a href="/" class="btn btn--primary">Go to Dashboard</a>
      </div>
    `,
    );
    return res.status(404).send(errorHtml);
  }

  // Check if user is already in the class
  const existingRole = await classRoleService.getClassRole(userId, klass.id);

  if (existingRole) {
    // Already a member, redirect to class page
    return res.redirect(`/classes/${klass.id}`);
  }

  // Add user to class as student
  await classRoleService.upsertClassRole({
    userId,
    classId: klass.id,
    role: "STUDENT",
  });

  // Show success page
  const successHtml = createBaseLayout(
    "Joined Class",
    `
    <div style="text-align: center; padding: 48px;">
      <div style="font-size: 64px; margin-bottom: 16px; color: var(--color-brand-medium);">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h2 style="margin-bottom: 8px;">Welcome to ${klass.name}!</h2>
      <p style="color: var(--color-text-muted); margin-bottom: 24px;">
        You have successfully joined the class.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <a href="/classes/my-classes" class="btn btn--secondary">View All Classes</a>
        <a href="/classes/${klass.id}" class="btn btn--primary">Go to Class</a>
      </div>
    </div>
  `,
  );
  res.send(successHtml);
});

/**
 * Update Class
 * Route: PUT /classes/:id
 */
export const updateClass = asyncHandler(async (req, res) => {
  const klass = await classService.updateClass(req.params.id, req.body);
  res.json(klass);
});

/**
 * Delete Class
 * Route: DELETE /classes/:id
 */
export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.status(204).send();
});

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Render Create Class Form (HTMX)
 */
export const renderCreateClassForm = asyncHandler(async (req, res) => {
  const isProf = req.user.isProf === true;
  if (!isProf) {
    return res.status(401).send("Unauthorized to create class.");
  }

  const upcomingQuarters = getUpcomingQuarters();
  res.status(201).send(createClassForm(upcomingQuarters));
});

/**
 * Close Create Class Form (HTMX)
 */
export const closeCreateClassForm = asyncHandler(async (req, res) => {
  res.status(201).send("");
});
