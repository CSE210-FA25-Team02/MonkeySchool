// =============================
//  Class Controller (JSON API)
// =============================

import * as classService from "../services/class.service.js";
import * as classRoleService from "../services/classRole.service.js";
import {
  getUpcomingQuarters,
  createBaseLayout,
  escapeHtml,
} from "../utils/html-templates.js";
import {
  createClassForm,
  displayInvite,
  createClassPage,
} from "../utils/htmx-templates/classes-templates.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";

/**
 * Create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const { name, quarter } = req.body;

  // User Authentication
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).send("Authentication required");
  }

  const isProf = req.user?.isProf === true;
  if (!isProf) {
    return res.status(401).send("Unauthorized to create class.");
  }

  // Validate input
  if (!name || name.trim().length === 0) {
    return res.status(400).send("Class name is required.");
  }

  // Create class
  let klass;
  try {
    klass = await classService.createClass({ name, quarter });
  } catch (err) {
    console.error("Error creating class:", err);
    return res.status(500).send("Failed to create class. Try again.");
  }

  // Get Class by invite code
  const classId = klass.id;

  // Add Professor who made call to class
  if (userId && userId !== 1) {
    try {
      await classRoleService.upsertClassRole({
        userId,
        classId,
        role: "PROFESSOR",
      });
    } catch (err) {
      console.error("Unable to assign professor to class:", err);
      return res.status(500).send("Unable to assign professor to class.");
    }
  }

  // Create invite URL
  const inviteUrl = `${req.protocol}://${req.get("host")}/invite/${klass.inviteCode}`;

  // Check if request is HTMX
  const isHTMX = req.headers["hx-request"];

  if (isHTMX) {
    res.status(201).send(displayInvite(inviteUrl));
  } else {
    res.status(201).json(klass);
  }
});

/**
 * Get class by ID (includes roster + groups)
 */
export const getClass = asyncHandler(async (req, res) => {
  const klass = await classService.getClassById(req.params.id);
  if (!klass) throw new NotFoundError("Class not found");
  res.json(klass);
});

/**
 * Get class by invite code (public join flow)
 */
export const getClassByInviteCode = asyncHandler(async (req, res) => {
  const klass = await classService.getClassByInviteCode(req.params.code);
  if (!klass) throw new NotFoundError("Class not found");

  // User Authentication
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).send("Authentication required");
  }

  const classId = klass.id;

  // Add Student (assumed)
  if (userId && userId !== 0) {
    try {
      await classRoleService.upsertClassRole({
        userId,
        classId,
        role: "STUDENT",
      });
    } catch (err) {
      console.error("Unable to assign user to class:", err);
      return res.status(500).send("Unable to assign user to class.");
    }
  }

  res.json(klass);
});

/**
 * Update class name, quarter, etc.
 */
export const updateClass = asyncHandler(async (req, res) => {
  const klass = await classService.updateClass(req.params.id, req.body);
  res.json(klass);
});

/**
 * Get all classes for a specific user
 * Requires authentication via middleware
 */
export const getUserClasses = asyncHandler(async (req, res) => {
  // Require authentication via middleware; `req.user` must be set by auth
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const classes = await classService.getClassesByUserId(userId);
  res.json(classes);
});

/**
 * Render class list page for HTMX
 * Uses authenticated user from JWT cookie
 * Supports both HTMX requests (HTML fragment) and direct navigation (full page)
 */
export const renderUserClasses = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).send("Authentication required");
  }

  const classes = await classService.getClassesByUserId(userId);
  const content = renderClassListHTML(classes);

  // Check if this is an HTMX request or direct browser navigation
  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    // HTMX request: return HTML fragment for dynamic content swap
    res.send(content);
  } else {
    // Direct navigation: return full HTML page with styles and layout
    const fullPage = createBaseLayout("My Classes", content);
    res.send(fullPage);
  }
});

/**
 * Delete a class by ID
 */
export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.status(204).send();
});

/**
 * Open/Close Class Create Form
 */
export const renderCreateClassForm = asyncHandler(async (req, res) => {
  const upcomingQuarters = getUpcomingQuarters();
  res.status(201).send(createClassForm(upcomingQuarters));
});

export const closeCreateClassForm = asyncHandler(async (req, res) => {
  res.status(201).send("");
});

/**
 * Render Classes Page (NEED TO REMOVE LATER)
 */
export const renderClassPage = asyncHandler(async (req, res) => {
  res
    .status(201)
    .send(createBaseLayout(`Your Classes`, createClassPage(req.user)));
});

/**
 * Helper function to render class list HTML
 * @param {Array} classes Array of classes to display
 * @returns {string} HTML class list
 */
function renderClassListHTML(classes) {
  // Always show the Create New Class button for professors (or all users for now)
  const createButton = `
    <div class="class-list__actions">
      <button 
        class="classes-modal__button classes-modal__button--primary"
        hx-get="/classes/form"
        hx-target="#modal-container"
        hx-swap="beforeend"
        type="button"
      >
        Create New Class
      </button>
      <div id="modal-container"></div>
    </div>
  `;
  if (!classes || classes.length === 0) {
    return `
      <section class="class-list" role="region" aria-labelledby="classes-title">
      ${createButton}
        <div class="class-list__header">
          <h2 id="classes-title" class="class-list__title">My Classes</h2>
        </div>
        <div class="class-list__empty">
          <div class="class-list__empty-icon" aria-hidden="true"></div>
          <h3 class="class-list__empty-title">No Classes Found</h3>
          <p class="class-list__empty-message">
            You are not enrolled in any classes yet.<br>
            Contact your instructor for an invite code to join a class.
          </p>
        </div>
      </section>
    `;
  }

  const classCards = classes
    .map((klass) => {
      const roleClass = klass.role.toLowerCase().replace("_", "-");
      const quarter = klass.quarter || "Not specified";

      const createdDate = klass.createdAt
        ? new Date(klass.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";

      return `
      <article class="class-card" role="article">
        <div class="class-card__sidebar">
          <div class="class-card__icon" aria-hidden="true"></div>
        </div>
        
        <div class="class-card__content">
          <div class="class-card__header">
            <div>
              <h3 class="class-card__title">${escapeHtml(klass.name)}</h3>
              <p class="class-card__quarter">${escapeHtml(quarter)}</p>
            </div>
            <span class="class-card__role class-card__role--${roleClass}" 
                  role="status"
                  aria-label="Your role: ${klass.role}">
              ${klass.role}
            </span>
          </div>
          
          <div class="class-card__body">
            <div class="class-card__info">
              <div class="class-card__info-item">
                <span class="class-card__info-label">Invite Code:</span>
                <code class="class-card__invite-code">${escapeHtml(klass.inviteCode)}</code>
              </div>
              ${
                createdDate
                  ? `
              <div class="class-card__info-item">
                <span class="class-card__info-label">Created:</span>
                <span class="class-card__info-value">${createdDate}</span>
              </div>
              `
                  : ""
              }
            </div>
          </div>
          
          <div class="class-card__footer">
            <a href="/classes/${klass.id}" 
               class="class-card__link"
               hx-get="/classes/${klass.id}"
               hx-target="#main-content"
               hx-push-url="true"
               hx-indicator="#loading"
               aria-label="View details for ${escapeHtml(klass.name)}">
              View Details
            </a>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  return `
    <section class="class-list" role="region" aria-labelledby="classes-title">
      ${createButton}  
    <div class="class-list__header">
        <h2 id="classes-title" class="class-list__title">My Classes</h2>
        <p class="class-list__count">${classes.length} ${classes.length === 1 ? "class" : "classes"}</p>
      </div>
      <div class="class-cards">
        ${classCards}
      </div>
    </section>
  `;
}
