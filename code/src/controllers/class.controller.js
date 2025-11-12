// Class Controller - JSON API Edition

import * as classService from "../services/class.service.js";
import * as classRoleService from "../services/classRole.service.js";
import {
  getUpcomingQuarters,
  createBaseLayout,
} from "../utils/html-templates.js";
import {
  createClassForm,
  displayInvite,
  createClassPage,
} from "../utils/htmx-templates/classes-templates.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { escapeHtml } from "../utils/html-templates.js";

/**
 * Create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const { name, quarter } = req.body;

  // User Authentication
  const userId = req.user?.id || 1;
  if (!userId) {
    return res
      .status(400)
      .send("No user found. Authentication not implemented.");
  }

  const isProf = req.user?.isProf || true;
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
  const userId = req?.user?.id || 0;
  if (!userId) {
    return res
      .status(400)
      .send("No user found. Authentication not implemented.");
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
  // Priority: JWT auth (production), fallback to query param (testing)
  // TODO: Remove query param fallback once full JWT auth is deployed
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(401).json({
      error: "Authentication required",
    });
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
  // Priority: JWT auth (production), fallback to query param (testing)
  // TODO: Remove query param fallback once full JWT auth is deployed
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.send(renderAuthRequiredHTML());
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
    const fullPage = renderFullPage(content, "My Classes");
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
 */
function renderClassListHTML(classes) {
  if (!classes || classes.length === 0) {
    return `
      <section class="class-list" role="region" aria-labelledby="classes-title">
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
               hx-get="/api/classes/${klass.id}"
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

/**
 * Helper function to render auth required message
 */
function renderAuthRequiredHTML() {
  return `
    <section class="class-list" role="region">
      <div class="class-list__error">
        <div class="class-list__error-icon" aria-hidden="true"></div>
        <h2 class="class-list__error-title">Authentication Required</h2>
        <p class="class-list__error-message">
          Please log in to view your classes.<br>
          You need to be authenticated to access this page.
        </p>
      </div>
    </section>
  `;
}

/**
 * Helper function to render full HTML page for direct navigation
 * Wraps content in complete HTML structure with styles and layout
 */
function renderFullPage(content, title = "My Classes") {
  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - Monkey School</title>
    
    <!-- HTMX Library -->
    <script src="https://unpkg.com/htmx.org@1.9.8" 
            integrity="sha384-rgjA7mptc2ETQqXoYC3/zJvkU7K/aP44Y+z7xQuJiVnB/422P/Ak+F/AqFR7E4Wr" 
            crossorigin="anonymous"></script>
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossorigin="anonymous" 
          referrerpolicy="no-referrer" />
    
    <!-- Application Styles -->
    <link rel="stylesheet" href="/css/navbar.css">
    <link rel="stylesheet" href="/css/main.css">
    
    <!-- Application Scripts -->
    <script type="module" src="/js/app.js" defer></script>
</head>
<body>
    <!-- Skip to main content for screen readers -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Navigation Bar (Left Fixed) -->
    <div id="navbar" class="navbar"></div>
    
    <!-- Sub-Menu (Collapsible Side Menu) -->
    <div id="submenu" class="submenu"></div>
    
    <!-- Header (Top Bar) -->
    <header id="header" class="header" role="banner">
        <div class="container">
            <div class="header__content">
                <div class="header__left"></div>
                <div class="header__right"></div>
            </div>
            <h1 class="header__title">
                <a href="/" class="header__link">Student Management System</a>
            </h1>
        </div>
    </header>

    <main id="main-content" class="main" role="main" tabindex="-1">
        <div class="container">
            ${content}
        </div>
    </main>

    <footer id="footer" class="footer" role="contentinfo"></footer>
</body>
</html>
  `;
}
