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
 * Get class directory data as JSON for testing
 * Returns the raw directory data structure for API consumption
 */
export const getClassDirectory = asyncHandler(async (req, res) => {
  const directory = await classService.getClassDirectory(req.params.id);
  if (!directory) throw new NotFoundError("Class not found");

  res.json(directory);
});

/**
 * Render class directory content for HTMX content swap
 * Returns only the directory HTML content, not full page
 */
export const renderClassDirectory = asyncHandler(async (req, res) => {
  const directory = await classService.getClassDirectory(req.params.id);
  if (!directory) throw new NotFoundError("Class not found");

  // Render directory HTML content for HTMX swap
  const content = renderDirectoryHTML(directory);
  res.send(content);
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
            <a href="/classes/${klass.id}/directory" 
               class="class-card__link"
               hx-get="/classes/${klass.id}/directory"
               hx-get="/classes/${klass.id}"
               hx-target="#main-content"
               hx-push-url="true"
               hx-indicator="#loading"
               aria-label="View directory for ${escapeHtml(klass.name)}">
              View Directory
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

/**
 * Helper function to render auth required message
 * @returns {string} HTML string for authentication required message
 */
// eslint-disable-next-line no-unused-vars
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
 * @param {string} content - HTML content to render inside the page
 * @param {string} title - Page title
 * @returns {string} Complete HTML page structure
 */
// eslint-disable-next-line no-unused-vars
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

/**
 * Helper function to render class directory HTML content
 * Returns only the content HTML for HTMX swapping
 * @param {Object} directory - The directory data object
 * @returns {string} The rendered HTML content
 */
function renderDirectoryHTML(directory) {
  const {
    class: classInfo,
    professors,
    tas,
    tutors,
    groups,
    studentsWithoutGroup,
  } = directory;

  // Calculate total members for summary
  const totalMembers =
    professors.length +
    tas.length +
    tutors.length +
    groups.reduce((sum, group) => sum + group.members.length, 0) +
    studentsWithoutGroup.length;

  // Render professors section
  const professorsHTML =
    professors.length > 0
      ? `
    <section class="directory-section directory-section--professors" aria-labelledby="professors-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--professors" aria-hidden="true">
            <i class="fas fa-chalkboard-teacher"></i>
          </div>
          <div class="section-info">
            <h3 id="professors-title" class="section-title">Professors</h3>
            <p class="section-count">${professors.length} ${professors.length === 1 ? "professor" : "professors"}</p>
          </div>
        </div>
        <div class="section-badge section-badge--professors">${professors.length}</div>
      </div>
      <div class="members-grid members-grid--professors">
        ${professors.map((prof) => renderMemberCard(prof, "professor")).join("")}
      </div>
    </section>
  `
      : "";

  // Render TAs section
  const tasHTML =
    tas.length > 0
      ? `
    <section class="directory-section directory-section--tas" aria-labelledby="tas-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--tas" aria-hidden="true">
            <i class="fas fa-user-graduate"></i>
          </div>
          <div class="section-info">
            <h3 id="tas-title" class="section-title">Teaching Assistants</h3>
            <p class="section-count">${tas.length} ${tas.length === 1 ? "TA" : "TAs"}</p>
          </div>
        </div>
        <div class="section-badge section-badge--tas">${tas.length}</div>
      </div>
      <div class="members-grid members-grid--tas">
        ${tas.map((ta) => renderMemberCard(ta, "ta")).join("")}
      </div>
    </section>
  `
      : "";

  // Render Tutors section
  const tutorsHTML =
    tutors.length > 0
      ? `
    <section class="directory-section directory-section--tutors" aria-labelledby="tutors-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--tutors" aria-hidden="true">
            <i class="fas fa-hands-helping"></i>
          </div>
          <div class="section-info">
            <h3 id="tutors-title" class="section-title">Tutors</h3>
            <p class="section-count">${tutors.length} ${tutors.length === 1 ? "tutor" : "tutors"}</p>
          </div>
        </div>
        <div class="section-badge section-badge--tutors">${tutors.length}</div>
      </div>
      <div class="members-grid members-grid--tutors">
        ${tutors.map((tutor) => renderMemberCard(tutor, "tutor")).join("")}
      </div>
    </section>
  `
      : "";

  // Render Groups section
  const groupsHTML =
    groups.length > 0
      ? `
    <section class="directory-section directory-section--groups" aria-labelledby="groups-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--groups" aria-hidden="true">
            <i class="fas fa-users"></i>
          </div>
          <div class="section-info">
            <h3 id="groups-title" class="section-title">Project Groups</h3>
            <p class="section-count">${groups.length} ${groups.length === 1 ? "group" : "groups"}</p>
          </div>
        </div>
        <div class="section-badge section-badge--groups">${groups.length}</div>
      </div>
      <div class="groups-container">
        ${groups.map((group) => renderGroupCard(group)).join("")}
      </div>
    </section>
  `
      : "";

  // Render students without group
  const ungroupedHTML =
    studentsWithoutGroup.length > 0
      ? `
    <section class="directory-section directory-section--ungrouped" aria-labelledby="ungrouped-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--ungrouped" aria-hidden="true">
            <i class="fas fa-user-friends"></i>
          </div>
          <div class="section-info">
            <h3 id="ungrouped-title" class="section-title">Students Not in Groups</h3>
            <p class="section-count">${studentsWithoutGroup.length} ${studentsWithoutGroup.length === 1 ? "student" : "students"}</p>
          </div>
        </div>
        <div class="section-badge section-badge--ungrouped">${studentsWithoutGroup.length}</div>
      </div>
      <div class="members-grid members-grid--ungrouped">
        ${studentsWithoutGroup.map((student) => renderMemberCard(student, "student")).join("")}
      </div>
    </section>
  `
      : "";

  // Empty state when no members exist
  const emptyStateHTML =
    totalMembers === 0
      ? `
    <div class="directory-empty">
      <div class="directory-empty__icon" aria-hidden="true">
        <i class="fas fa-users-slash"></i>
      </div>
      <h3 class="directory-empty__title">No Members Found</h3>
      <p class="directory-empty__message">
        This class directory is empty. Members will appear here once they join the class.
      </p>
    </div>
  `
      : "";

  return `
    <div class="class-directory">
      <div class="directory-header">
        <div class="directory-header__main">
          <h2 class="directory-title">${escapeHtml(classInfo.name)} Directory</h2>
          <div class="directory-meta">
            <span class="directory-quarter">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i>
              ${escapeHtml(classInfo.quarter || "No quarter specified")}
            </span>
            ${
              totalMembers > 0
                ? `
            <span class="directory-total">
              <i class="fas fa-users" aria-hidden="true"></i>
              ${totalMembers} total ${totalMembers === 1 ? "member" : "members"}
            </span>
            `
                : ""
            }
          </div>
        </div>
      </div>
      
      ${emptyStateHTML}
      ${professorsHTML}
      ${tasHTML}
      ${tutorsHTML}
      ${groupsHTML}
      ${ungroupedHTML}
    </div>
  `;
}

/**
 * Helper function to render individual member cards
 * @param {Object} member - The member data object
 * @param {string} roleType - The role type (professor, ta, tutor, student)
 * @returns {string} The rendered member card HTML
 */
function renderMemberCard(member, roleType) {
  const displayName = member.preferredName || member.name;
  // Use a data URL placeholder instead of missing file
  const defaultAvatar =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+";
  const photoUrl = member.photoUrl || defaultAvatar;

  // Build contact links with proper icons and styling
  const contactLinks = [];
  if (member.email) {
    contactLinks.push(`
      <a href="mailto:${escapeHtml(member.email)}" 
         class="contact-link contact-link--email" 
         title="Email ${escapeHtml(displayName)}"
         aria-label="Email ${escapeHtml(displayName)}">
        <i class="fas fa-envelope" aria-hidden="true"></i>
        <span class="contact-label">Email</span>
      </a>
    `);
  }
  if (member.phone) {
    contactLinks.push(`
      <a href="tel:${escapeHtml(member.phone)}" 
         class="contact-link contact-link--phone" 
         title="Call ${escapeHtml(displayName)}"
         aria-label="Call ${escapeHtml(displayName)}">
        <i class="fas fa-phone" aria-hidden="true"></i>
        <span class="contact-label">Phone</span>
      </a>
    `);
  }
  if (member.github) {
    contactLinks.push(`
      <a href="https://github.com/${escapeHtml(member.github)}" 
         class="contact-link contact-link--github" 
         title="Visit ${escapeHtml(displayName)}'s GitHub"
         aria-label="Visit ${escapeHtml(displayName)}'s GitHub"
         target="_blank" 
         rel="noopener noreferrer">
        <i class="fab fa-github" aria-hidden="true"></i>
        <span class="contact-label">GitHub</span>
      </a>
    `);
  }

  // Build optional info sections
  const pronunciationHTML = member.pronunciation
    ? `
    <div class="member-detail member-pronunciation">
      <i class="fas fa-volume-up" aria-hidden="true"></i>
      <span class="member-pronunciation-text">${escapeHtml(member.pronunciation)}</span>
    </div>
  `
    : "";

  const pronounsHTML = member.pronouns
    ? `
    <div class="member-detail member-pronouns">
      <i class="fas fa-id-badge" aria-hidden="true"></i>
      <span class="member-pronouns-text">${escapeHtml(member.pronouns)}</span>
    </div>
  `
    : "";

  const bioHTML = member.bio
    ? `
    <div class="member-bio-container">
      <p class="member-bio">${escapeHtml(member.bio)}</p>
    </div>
  `
    : "";

  return `
    <article class="member-card member-card--${roleType}" 
             role="article" 
             tabindex="0"
             aria-label="Profile for ${escapeHtml(displayName)}">
      <div class="member-card__inner">
        <div class="member-card__header">
          <div class="member-avatar">
            <img src="${escapeHtml(photoUrl)}" 
                 alt="" 
                 class="avatar-image"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+'">
            <div class="member-status member-status--${roleType}"></div>
          </div>
          <div class="member-role-badge member-role-badge--${roleType}">
            ${roleType.charAt(0).toUpperCase() + roleType.slice(1)}
          </div>
        </div>
        
        <div class="member-card__body">
          <h4 class="member-name">${escapeHtml(displayName)}</h4>
          
          <div class="member-details">
            ${pronunciationHTML}
            ${pronounsHTML}
          </div>
          
          ${bioHTML}
          
          ${
            contactLinks.length > 0
              ? `
            <div class="member-contacts">
              <div class="contacts-label">
                <i class="fas fa-address-card" aria-hidden="true"></i>
                Contact
              </div>
              <div class="contact-links">
                ${contactLinks.join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

/**
 * Helper function to render group cards
 * @param {Object} group - The group data object
 * @returns {string} The rendered group card HTML
 */
function renderGroupCard(group) {
  // Use a data URL placeholder instead of missing file
  const defaultGroupLogo =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzhCNUNGNiIvPgo8cGF0aCBkPSJNMjAgMTJjLTQuNDE4IDAtOCAzLjU4Mi04IDhzMy41ODIgOCA4IDggOC0zLjU4MiA4LTgtMy41ODItOC04LTh6bS0yIDZ2NGgydi00aDJ2NGgyVjE4aDJ2NGgyVjE4aDAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOSIvPgo8L3N2Zz4=";
  const logoUrl = group.logoUrl || defaultGroupLogo;

  // Separate leaders and regular members
  const leaders = group.members.filter((member) => member.isLeader);
  const regularMembers = group.members.filter((member) => !member.isLeader);
  const totalMembers = group.members.length;

  // Build member avatars for the group header
  const memberAvatars = group.members
    .slice(0, 4)
    .map((member, index) => {
      const displayName = member.preferredName || member.name;
      const photoUrl =
        member.photoUrl ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+";

      return `
      <div class="group-avatar-item ${member.isLeader ? "group-avatar--leader" : ""}" 
           style="z-index: ${4 - index};"
           title="${escapeHtml(displayName)}${member.isLeader ? " (Leader)" : ""}">
        <img src="${escapeHtml(photoUrl)}" 
             alt="${escapeHtml(displayName)}" 
             class="group-member-avatar"
             onerror="this.src='/images/default-avatar.png'">
        ${member.isLeader ? '<div class="leader-indicator"><i class="fas fa-crown"></i></div>' : ""}
      </div>
    `;
    })
    .join("");

  const remainingCount = totalMembers > 4 ? totalMembers - 4 : 0;

  // Build detailed member list
  const leadersHTML =
    leaders.length > 0
      ? `
    <div class="group-members-section">
      <div class="members-section-header">
        <i class="fas fa-crown" aria-hidden="true"></i>
        <span class="members-section-title">${leaders.length === 1 ? "Leader" : "Leaders"}</span>
        <span class="members-section-count">${leaders.length}</span>
      </div>
      <div class="members-section-list">
        ${leaders.map((member) => renderGroupMember(member, true)).join("")}
      </div>
    </div>
  `
      : "";

  const membersHTML =
    regularMembers.length > 0
      ? `
    <div class="group-members-section">
      <div class="members-section-header">
        <i class="fas fa-users" aria-hidden="true"></i>
        <span class="members-section-title">Members</span>
        <span class="members-section-count">${regularMembers.length}</span>
      </div>
      <div class="members-section-list">
        ${regularMembers.map((member) => renderGroupMember(member, false)).join("")}
      </div>
    </div>
  `
      : "";

  return `
    <article class="group-card" 
             role="article" 
             tabindex="0"
             aria-label="Project group: ${escapeHtml(group.name)}">
      <div class="group-card__inner">
        <div class="group-card__header">
          <div class="group-logo-container">
            <img src="${escapeHtml(logoUrl)}" 
                 alt="" 
                 class="group-logo"
                 onerror="this.src='/images/default-group.png'">
            <div class="group-member-count">
              <i class="fas fa-users" aria-hidden="true"></i>
              <span>${totalMembers}</span>
            </div>
          </div>
          
          <div class="group-info">
            <h4 class="group-name">${escapeHtml(group.name)}</h4>
            
            ${
              group.mantra
                ? `
              <div class="group-mantra-container">
                <i class="fas fa-quote-left" aria-hidden="true"></i>
                <p class="group-mantra">${escapeHtml(group.mantra)}</p>
              </div>
            `
                : ""
            }
            
            ${
              group.github
                ? `
              <div class="group-links">
                <a href="https://github.com/${escapeHtml(group.github)}" 
                   class="group-link group-link--github" 
                   title="Visit ${escapeHtml(group.name)}'s GitHub repository"
                   aria-label="Visit ${escapeHtml(group.name)}'s GitHub repository"
                   target="_blank" 
                   rel="noopener noreferrer">
                  <i class="fab fa-github" aria-hidden="true"></i>
                  <span>GitHub Repository</span>
                  <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                </a>
              </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="group-members-preview">
          <div class="group-avatars">
            ${memberAvatars}
            ${
              remainingCount > 0
                ? `
              <div class="group-avatar-more" title="and ${remainingCount} more ${remainingCount === 1 ? "member" : "members"}">
                <span>+${remainingCount}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="group-card__body">
          ${leadersHTML}
          ${membersHTML}
        </div>
      </div>
    </article>
  `;
}

/**
 * Helper function to render individual group member items
 * @param {Object} member - The member data object
 * @param {boolean} isLeader - Whether the member is a leader
 * @returns {string} The rendered group member item HTML
 */
function renderGroupMember(member, isLeader) {
  const displayName = member.preferredName || member.name;
  const photoUrl =
    member.photoUrl ||
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+";

  // Build contact links for group members
  const contactLinks = [];
  if (member.email) {
    contactLinks.push(`
      <a href="mailto:${escapeHtml(member.email)}" 
         class="group-member-contact" 
         title="Email ${escapeHtml(displayName)}"
         aria-label="Email ${escapeHtml(displayName)}">
        <i class="fas fa-envelope" aria-hidden="true"></i>
      </a>
    `);
  }
  if (member.github) {
    contactLinks.push(`
      <a href="https://github.com/${escapeHtml(member.github)}" 
         class="group-member-contact" 
         title="Visit ${escapeHtml(displayName)}'s GitHub"
         aria-label="Visit ${escapeHtml(displayName)}'s GitHub"
         target="_blank" 
         rel="noopener noreferrer">
        <i class="fab fa-github" aria-hidden="true"></i>
      </a>
    `);
  }

  return `
    <div class="group-member-item ${isLeader ? "group-member-item--leader" : ""}">
      <div class="group-member-info">
        <div class="group-member-avatar-container">
          <img src="${escapeHtml(photoUrl)}" 
               alt="${escapeHtml(displayName)}" 
               class="group-member-item-avatar"
               onerror="this.src='/images/default-avatar.png'">
          ${
            isLeader
              ? `
            <div class="group-member-leader-badge">
              <i class="fas fa-crown" aria-hidden="true"></i>
            </div>
          `
              : ""
          }
        </div>
        <div class="group-member-details">
          <span class="group-member-name">${escapeHtml(displayName)}</span>
          ${
            member.pronouns
              ? `
            <span class="group-member-pronouns">${escapeHtml(member.pronouns)}</span>
          `
              : ""
          }
        </div>
      </div>
      
      ${
        contactLinks.length > 0
          ? `
        <div class="group-member-contacts">
          ${contactLinks.join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}
