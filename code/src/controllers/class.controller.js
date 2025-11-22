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
<<<<<<< HEAD
               hx-get="/api/classes/${klass.id}/directory"
=======
               hx-get="/classes/${klass.id}"
>>>>>>> origin/develop
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
<<<<<<< HEAD

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
function renderFullPage(content, title = 'My Classes') {
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
  const { class: classInfo, professors, tas, tutors, groups, studentsWithoutGroup } = directory;

  // Calculate total members for summary
  const totalMembers = professors.length + tas.length + tutors.length + 
    groups.reduce((sum, group) => sum + group.members.length, 0) + studentsWithoutGroup.length;

  // Render professors section
  const professorsHTML = professors.length > 0 ? `
    <section class="directory-section directory-section--professors" aria-labelledby="professors-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--professors" aria-hidden="true">
            <i class="fas fa-chalkboard-teacher"></i>
          </div>
          <div class="section-info">
            <h3 id="professors-title" class="section-title">Professors</h3>
            <p class="section-count">${professors.length} ${professors.length === 1 ? 'professor' : 'professors'}</p>
          </div>
        </div>
        <div class="section-badge section-badge--professors">${professors.length}</div>
      </div>
      <div class="members-grid members-grid--professors">
        ${professors.map(prof => renderMemberCard(prof, 'professor')).join('')}
      </div>
    </section>
  ` : '';

  // Render TAs section
  const tasHTML = tas.length > 0 ? `
    <section class="directory-section directory-section--tas" aria-labelledby="tas-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--tas" aria-hidden="true">
            <i class="fas fa-user-graduate"></i>
          </div>
          <div class="section-info">
            <h3 id="tas-title" class="section-title">Teaching Assistants</h3>
            <p class="section-count">${tas.length} ${tas.length === 1 ? 'TA' : 'TAs'}</p>
          </div>
        </div>
        <div class="section-badge section-badge--tas">${tas.length}</div>
      </div>
      <div class="members-grid members-grid--tas">
        ${tas.map(ta => renderMemberCard(ta, 'ta')).join('')}
      </div>
    </section>
  ` : '';

  // Render Tutors section
  const tutorsHTML = tutors.length > 0 ? `
    <section class="directory-section directory-section--tutors" aria-labelledby="tutors-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--tutors" aria-hidden="true">
            <i class="fas fa-hands-helping"></i>
          </div>
          <div class="section-info">
            <h3 id="tutors-title" class="section-title">Tutors</h3>
            <p class="section-count">${tutors.length} ${tutors.length === 1 ? 'tutor' : 'tutors'}</p>
          </div>
        </div>
        <div class="section-badge section-badge--tutors">${tutors.length}</div>
      </div>
      <div class="members-grid members-grid--tutors">
        ${tutors.map(tutor => renderMemberCard(tutor, 'tutor')).join('')}
      </div>
    </section>
  ` : '';

  // Render Groups section
  const groupsHTML = groups.length > 0 ? `
    <section class="directory-section directory-section--groups" aria-labelledby="groups-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--groups" aria-hidden="true">
            <i class="fas fa-users"></i>
          </div>
          <div class="section-info">
            <h3 id="groups-title" class="section-title">Project Groups</h3>
            <p class="section-count">${groups.length} ${groups.length === 1 ? 'group' : 'groups'}</p>
          </div>
        </div>
        <div class="section-badge section-badge--groups">${groups.length}</div>
      </div>
      <div class="groups-container">
        ${groups.map(group => renderGroupCard(group)).join('')}
      </div>
    </section>
  ` : '';

  // Render students without group
  const ungroupedHTML = studentsWithoutGroup.length > 0 ? `
    <section class="directory-section directory-section--ungrouped" aria-labelledby="ungrouped-title">
      <div class="section-header">
        <div class="section-header__main">
          <div class="section-icon section-icon--ungrouped" aria-hidden="true">
            <i class="fas fa-user-friends"></i>
          </div>
          <div class="section-info">
            <h3 id="ungrouped-title" class="section-title">Students Not in Groups</h3>
            <p class="section-count">${studentsWithoutGroup.length} ${studentsWithoutGroup.length === 1 ? 'student' : 'students'}</p>
          </div>
        </div>
        <div class="section-badge section-badge--ungrouped">${studentsWithoutGroup.length}</div>
      </div>
      <div class="members-grid members-grid--ungrouped">
        ${studentsWithoutGroup.map(student => renderMemberCard(student, 'student')).join('')}
      </div>
    </section>
  ` : '';

  // Empty state when no members exist
  const emptyStateHTML = totalMembers === 0 ? `
    <div class="directory-empty">
      <div class="directory-empty__icon" aria-hidden="true">
        <i class="fas fa-users-slash"></i>
      </div>
      <h3 class="directory-empty__title">No Members Found</h3>
      <p class="directory-empty__message">
        This class directory is empty. Members will appear here once they join the class.
      </p>
    </div>
  ` : '';

  return `
    <div class="class-directory">
      <div class="directory-header">
        <div class="directory-header__main">
          <h2 class="directory-title">${escapeHtml(classInfo.name)} Directory</h2>
          <div class="directory-meta">
            <span class="directory-quarter">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i>
              ${escapeHtml(classInfo.quarter || 'No quarter specified')}
            </span>
            ${totalMembers > 0 ? `
            <span class="directory-total">
              <i class="fas fa-users" aria-hidden="true"></i>
              ${totalMembers} total ${totalMembers === 1 ? 'member' : 'members'}
            </span>
            ` : ''}
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
    
    <style>
      /* Directory Styles */
      .class-directory {
        padding: 2rem 0;
        max-width: 1400px;
        margin: 0 auto;
      }

      .directory-header {
        margin-bottom: 3rem;
        padding: 0 1rem;
      }

      .directory-header__main {
        text-align: center;
      }

      .directory-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-primary-bg);
        margin: 0 0 1rem 0;
        line-height: 1.2;
      }

      .directory-meta {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        font-size: 0.95rem;
        color: var(--color-neutral-600);
      }

      .directory-quarter,
      .directory-total {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
      }

      .directory-quarter i,
      .directory-total i {
        color: var(--color-primary-bg);
      }

      /* Empty State */
      .directory-empty {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
        margin: 0 1rem;
      }

      .directory-empty__icon {
        font-size: 4rem;
        color: var(--color-neutral-400);
        margin-bottom: 1.5rem;
      }

      .directory-empty__title {
        font-size: 1.5rem;
        color: var(--color-neutral-700);
        margin-bottom: 1rem;
        font-weight: 600;
      }

      .directory-empty__message {
        color: var(--color-neutral-600);
        font-size: 1rem;
        line-height: 1.6;
        max-width: 400px;
        margin: 0 auto;
      }

      /* Section Styling */
      .directory-section {
        margin-bottom: 3rem;
        padding: 0 1rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        background: white;
        box-shadow: var(--shadow-md);
        position: relative;
        overflow: hidden;
      }

      .section-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
      }

      .section-header__main {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .section-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      .section-info h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .section-count {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        color: var(--color-neutral-600);
        font-weight: 500;
      }

      .section-badge {
        min-width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
      }

      /* Professor Theme - Blue */
      .directory-section--professors .section-header::before {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }
      .section-icon--professors {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }
      .directory-section--professors .section-title {
        color: #1d4ed8;
      }
      .section-badge--professors {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }

      /* TA Theme - Red */
      .directory-section--tas .section-header::before {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }
      .section-icon--tas {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }
      .directory-section--tas .section-title {
        color: #dc2626;
      }
      .section-badge--tas {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      /* Tutor Theme - Green */
      .directory-section--tutors .section-header::before {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      .section-icon--tutors {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      .directory-section--tutors .section-title {
        color: #059669;
      }
      .section-badge--tutors {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      /* Groups Theme - Purple */
      .directory-section--groups .section-header::before {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }
      .section-icon--groups {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }
      .directory-section--groups .section-title {
        color: #7c3aed;
      }
      .section-badge--groups {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }

      /* Ungrouped Theme - Orange */
      .directory-section--ungrouped .section-header::before {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      .section-icon--ungrouped {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      .directory-section--ungrouped .section-title {
        color: #d97706;
      }
      .section-badge--ungrouped {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      /* Grid Layouts */
      .members-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        align-items: stretch;
      }

      .groups-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 2rem;
        align-items: stretch;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .directory-title {
          font-size: 2rem;
        }

        .directory-meta {
          gap: 1rem;
          font-size: 0.875rem;
        }

        .section-header {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
          padding: 1.25rem;
        }

        .section-header__main {
          flex-direction: column;
          text-align: center;
          gap: 0.75rem;
        }

        .section-icon {
          width: 50px;
          height: 50px;
          font-size: 1.25rem;
        }

        .section-badge {
          min-width: 40px;
          height: 40px;
          font-size: 1rem;
        }

        .members-grid {
          grid-template-columns: 1fr;
        }

        .groups-container {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 480px) {
        .class-directory {
          padding: 1rem 0;
        }

        .directory-header {
          margin-bottom: 2rem;
        }

        .directory-title {
          font-size: 1.75rem;
        }

        .directory-meta {
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-header {
          margin: 0 -0.5rem 1.5rem;
        }

        .directory-section {
          margin-bottom: 2rem;
          padding: 0 0.5rem;
        }
      }
    </style>
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
  const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+';
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
  const pronunciationHTML = member.pronunciation ? `
    <div class="member-detail member-pronunciation">
      <i class="fas fa-volume-up" aria-hidden="true"></i>
      <span class="member-pronunciation-text">${escapeHtml(member.pronunciation)}</span>
    </div>
  ` : '';

  const pronounsHTML = member.pronouns ? `
    <div class="member-detail member-pronouns">
      <i class="fas fa-id-badge" aria-hidden="true"></i>
      <span class="member-pronouns-text">${escapeHtml(member.pronouns)}</span>
    </div>
  ` : '';

  const bioHTML = member.bio ? `
    <div class="member-bio-container">
      <p class="member-bio">${escapeHtml(member.bio)}</p>
    </div>
  ` : '';
  
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
          
          ${contactLinks.length > 0 ? `
            <div class="member-contacts">
              <div class="contacts-label">
                <i class="fas fa-address-card" aria-hidden="true"></i>
                Contact
              </div>
              <div class="contact-links">
                ${contactLinks.join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </article>
    
    <style>
      /* Member Card Styles */
      .member-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        border: 2px solid transparent;
      }

      .member-card:hover,
      .member-card:focus {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        outline: none;
      }

      .member-card:focus {
        border-color: var(--color-primary);
      }

      .member-card__inner {
        padding: 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .member-card__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        position: relative;
      }

      .member-avatar {
        position: relative;
        flex-shrink: 0;
      }

      .avatar-image {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .member-status {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
      }

      .member-role-badge {
        padding: 0.375rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .member-card__body {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .member-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-neutral-900);
        margin: 0 0 0.75rem 0;
        line-height: 1.2;
      }

      .member-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .member-detail {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-neutral-600);
      }

      .member-detail i {
        width: 16px;
        font-size: 0.75rem;
        color: var(--color-neutral-500);
      }

      .member-bio-container {
        margin-bottom: 1rem;
        flex: 1;
      }

      .member-bio {
        font-size: 0.875rem;
        color: var(--color-neutral-700);
        line-height: 1.5;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .member-contacts {
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid var(--color-neutral-200);
      }

      .contacts-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-neutral-600);
        margin-bottom: 0.75rem;
        letter-spacing: 0.5px;
      }

      .contact-links {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .contact-link {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        background: var(--color-neutral-100);
        border-radius: 20px;
        text-decoration: none;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .contact-link:hover,
      .contact-link:focus {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .contact-link i {
        font-size: 0.875rem;
      }

      .contact-label {
        font-weight: 500;
      }

      /* Role-specific styling */
      
      /* Professor - Blue Theme */
      .member-card--professor:hover {
        border-color: #3b82f6;
      }
      .member-card--professor .member-status {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }
      .member-card--professor .member-role-badge {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }
      .member-card--professor .contact-link--email {
        color: #1d4ed8;
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.2);
      }
      .member-card--professor .contact-link--email:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
      }
      .member-card--professor .contact-link--phone {
        color: #1d4ed8;
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.2);
      }
      .member-card--professor .contact-link--phone:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
      }
      .member-card--professor .contact-link--github {
        color: #1d4ed8;
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.2);
      }
      .member-card--professor .contact-link--github:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
      }

      /* TA - Red Theme */
      .member-card--ta:hover {
        border-color: #ef4444;
      }
      .member-card--ta .member-status {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }
      .member-card--ta .member-role-badge {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }
      .member-card--ta .contact-link--email {
        color: #dc2626;
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.2);
      }
      .member-card--ta .contact-link--email:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
      }
      .member-card--ta .contact-link--phone {
        color: #dc2626;
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.2);
      }
      .member-card--ta .contact-link--phone:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
      }
      .member-card--ta .contact-link--github {
        color: #dc2626;
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.2);
      }
      .member-card--ta .contact-link--github:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.3);
      }

      /* Tutor - Green Theme */
      .member-card--tutor:hover {
        border-color: #10b981;
      }
      .member-card--tutor .member-status {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      .member-card--tutor .member-role-badge {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      .member-card--tutor .contact-link--email {
        color: #059669;
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
      }
      .member-card--tutor .contact-link--email:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.3);
      }
      .member-card--tutor .contact-link--phone {
        color: #059669;
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
      }
      .member-card--tutor .contact-link--phone:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.3);
      }
      .member-card--tutor .contact-link--github {
        color: #059669;
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.2);
      }
      .member-card--tutor .contact-link--github:hover {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.3);
      }

      /* Student - Orange Theme */
      .member-card--student:hover {
        border-color: #f59e0b;
      }
      .member-card--student .member-status {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      .member-card--student .member-role-badge {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      .member-card--student .contact-link--email {
        color: #d97706;
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.2);
      }
      .member-card--student .contact-link--email:hover {
        background: rgba(245, 158, 11, 0.2);
        border-color: rgba(245, 158, 11, 0.3);
      }
      .member-card--student .contact-link--phone {
        color: #d97706;
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.2);
      }
      .member-card--student .contact-link--phone:hover {
        background: rgba(245, 158, 11, 0.2);
        border-color: rgba(245, 158, 11, 0.3);
      }
      .member-card--student .contact-link--github {
        color: #d97706;
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.2);
      }
      .member-card--student .contact-link--github:hover {
        background: rgba(245, 158, 11, 0.2);
        border-color: rgba(245, 158, 11, 0.3);
      }

      /* Responsive Design */
      @media (max-width: 480px) {
        .member-card__inner {
          padding: 1rem;
        }

        .member-card__header {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
        }

        .avatar-image {
          width: 50px;
          height: 50px;
        }

        .member-name {
          font-size: 1.125rem;
          text-align: center;
        }

        .contact-links {
          justify-content: center;
        }
      }

      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        .member-card,
        .contact-link {
          transition: none;
        }
        
        .member-card:hover,
        .member-card:focus {
          transform: none;
        }
        
        .contact-link:hover,
        .contact-link:focus {
          transform: none;
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .member-card {
          border: 2px solid currentColor;
        }
        
        .contact-link {
          border: 2px solid currentColor;
        }
      }
    </style>
  `;
}

/**
 * Helper function to render group cards
 * @param {Object} group - The group data object
 * @returns {string} The rendered group card HTML
 */
function renderGroupCard(group) {
  // Use a data URL placeholder instead of missing file
  const defaultGroupLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzhCNUNGNiIvPgo8cGF0aCBkPSJNMjAgMTJjLTQuNDE4IDAtOCAzLjU4Mi04IDhzMy41ODIgOCA4IDggOC0zLjU4MiA4LTgtMy41ODItOC04LTh6bS0yIDZ2NGgydi00aDJ2NGgyVjE4aDJ2NGgyVjE4aDAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOSIvPgo8L3N2Zz4=';
  const logoUrl = group.logoUrl || defaultGroupLogo;
  
  // Separate leaders and regular members
  const leaders = group.members.filter(member => member.isLeader);
  const regularMembers = group.members.filter(member => !member.isLeader);
  const totalMembers = group.members.length;

  // Build member avatars for the group header
  const memberAvatars = group.members.slice(0, 4).map((member, index) => {
    const displayName = member.preferredName || member.name;
    const photoUrl = member.photoUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+';
    
    return `
      <div class="group-avatar-item ${member.isLeader ? 'group-avatar--leader' : ''}" 
           style="z-index: ${4 - index};"
           title="${escapeHtml(displayName)}${member.isLeader ? ' (Leader)' : ''}">
        <img src="${escapeHtml(photoUrl)}" 
             alt="${escapeHtml(displayName)}" 
             class="group-member-avatar"
             onerror="this.src='/images/default-avatar.png'">
        ${member.isLeader ? '<div class="leader-indicator"><i class="fas fa-crown"></i></div>' : ''}
      </div>
    `;
  }).join('');

  const remainingCount = totalMembers > 4 ? totalMembers - 4 : 0;

  // Build detailed member list
  const leadersHTML = leaders.length > 0 ? `
    <div class="group-members-section">
      <div class="members-section-header">
        <i class="fas fa-crown" aria-hidden="true"></i>
        <span class="members-section-title">${leaders.length === 1 ? 'Leader' : 'Leaders'}</span>
        <span class="members-section-count">${leaders.length}</span>
      </div>
      <div class="members-section-list">
        ${leaders.map(member => renderGroupMember(member, true)).join('')}
      </div>
    </div>
  ` : '';

  const membersHTML = regularMembers.length > 0 ? `
    <div class="group-members-section">
      <div class="members-section-header">
        <i class="fas fa-users" aria-hidden="true"></i>
        <span class="members-section-title">Members</span>
        <span class="members-section-count">${regularMembers.length}</span>
      </div>
      <div class="members-section-list">
        ${regularMembers.map(member => renderGroupMember(member, false)).join('')}
      </div>
    </div>
  ` : '';

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
            
            ${group.mantra ? `
              <div class="group-mantra-container">
                <i class="fas fa-quote-left" aria-hidden="true"></i>
                <p class="group-mantra">${escapeHtml(group.mantra)}</p>
              </div>
            ` : ''}
            
            ${group.github ? `
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
            ` : ''}
          </div>
        </div>
        
        <div class="group-members-preview">
          <div class="group-avatars">
            ${memberAvatars}
            ${remainingCount > 0 ? `
              <div class="group-avatar-more" title="and ${remainingCount} more ${remainingCount === 1 ? 'member' : 'members'}">
                <span>+${remainingCount}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="group-card__body">
          ${leadersHTML}
          ${membersHTML}
        </div>
      </div>
    </article>
    
    <style>
      /* Group Card Styles */
      .group-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        border: 2px solid transparent;
      }

      .group-card:hover,
      .group-card:focus {
        transform: translateY(-6px);
        box-shadow: 0 12px 32px rgba(139, 92, 246, 0.2);
        border-color: #8b5cf6;
        outline: none;
      }

      .group-card__inner {
        padding: 2rem;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .group-card__header {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
        align-items: flex-start;
      }

      .group-logo-container {
        position: relative;
        flex-shrink: 0;
      }

      .group-logo {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        object-fit: cover;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .group-member-count {
        position: absolute;
        bottom: -8px;
        right: -8px;
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
      }

      .group-member-count i {
        margin-right: 0.25rem;
        font-size: 0.625rem;
      }

      .group-info {
        flex: 1;
        min-width: 0;
      }

      .group-name {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-neutral-900);
        margin: 0 0 0.75rem 0;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .group-mantra-container {
        margin-bottom: 1rem;
        position: relative;
      }

      .group-mantra-container i {
        position: absolute;
        top: 0.25rem;
        left: 0;
        color: #8b5cf6;
        font-size: 0.875rem;
      }

      .group-mantra {
        font-size: 0.875rem;
        color: var(--color-neutral-700);
        font-style: italic;
        line-height: 1.5;
        margin: 0;
        padding-left: 1.5rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .group-links {
        display: flex;
        gap: 0.5rem;
      }

      .group-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(139, 92, 246, 0.1);
        color: #7c3aed;
        border-radius: 20px;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border: 1px solid rgba(139, 92, 246, 0.2);
      }

      .group-link:hover,
      .group-link:focus {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
      }

      .group-link i:first-child {
        font-size: 1rem;
      }

      .group-link i:last-child {
        font-size: 0.75rem;
      }

      .group-members-preview {
        margin-bottom: 1.5rem;
      }

      .group-avatars {
        display: flex;
        align-items: center;
        gap: -0.5rem;
        margin-left: 0.5rem;
      }

      .group-avatar-item {
        position: relative;
        margin-left: -0.5rem;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .group-avatar-item:first-child {
        margin-left: 0;
      }

      .group-member-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }

      .leader-indicator {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .leader-indicator i {
        font-size: 0.625rem;
        color: white;
      }

      .group-avatar--leader .group-member-avatar {
        border-color: #f59e0b;
      }

      .group-avatar-more {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-neutral-300), var(--color-neutral-400));
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-neutral-700);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-left: -0.5rem;
      }

      .group-card__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .group-members-section {
        background: var(--color-neutral-50);
        border-radius: 12px;
        padding: 1rem;
      }

      .members-section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-neutral-700);
      }

      .members-section-header i {
        font-size: 0.75rem;
        color: #8b5cf6;
      }

      .members-section-title {
        flex: 1;
      }

      .members-section-count {
        background: var(--color-neutral-300);
        color: var(--color-neutral-700);
        border-radius: 12px;
        padding: 0.125rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .members-section-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .group-card__inner {
          padding: 1.5rem;
        }

        .group-card__header {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1rem;
        }

        .group-logo {
          width: 60px;
          height: 60px;
        }

        .group-member-count {
          width: 28px;
          height: 28px;
          font-size: 0.625rem;
        }

        .group-name {
          font-size: 1.25rem;
          text-align: center;
        }

        .group-avatars {
          justify-content: center;
        }
      }

      @media (max-width: 480px) {
        .group-card__header {
          gap: 0.75rem;
        }

        .group-logo {
          width: 50px;
          height: 50px;
        }

        .group-member-count {
          width: 24px;
          height: 24px;
          font-size: 0.625rem;
          bottom: -6px;
          right: -6px;
        }

        .group-member-avatar {
          width: 32px;
          height: 32px;
        }

        .group-avatar-more {
          width: 32px;
          height: 32px;
          font-size: 0.625rem;
        }

        .leader-indicator {
          width: 16px;
          height: 16px;
          top: -3px;
          right: -3px;
        }

        .leader-indicator i {
          font-size: 0.5rem;
        }
      }

      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        .group-card,
        .group-link {
          transition: none;
        }
        
        .group-card:hover,
        .group-card:focus {
          transform: none;
        }
        
        .group-link:hover,
        .group-link:focus {
          transform: none;
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .group-card {
          border: 2px solid currentColor;
        }
        
        .group-link {
          border: 2px solid currentColor;
        }
      }
    </style>
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
  const photoUrl = member.photoUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzk5QTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LjYyNy01LjM3My0xMi0xMi0xMnMtMTIgNS4zNzMtMTIgMTIiIGZpbGw9IiM5OUEzQUYiLz4KPC9zdmc+';
  
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
    <div class="group-member-item ${isLeader ? 'group-member-item--leader' : ''}">
      <div class="group-member-info">
        <div class="group-member-avatar-container">
          <img src="${escapeHtml(photoUrl)}" 
               alt="${escapeHtml(displayName)}" 
               class="group-member-item-avatar"
               onerror="this.src='/images/default-avatar.png'">
          ${isLeader ? `
            <div class="group-member-leader-badge">
              <i class="fas fa-crown" aria-hidden="true"></i>
            </div>
          ` : ''}
        </div>
        <div class="group-member-details">
          <span class="group-member-name">${escapeHtml(displayName)}</span>
          ${member.pronouns ? `
            <span class="group-member-pronouns">${escapeHtml(member.pronouns)}</span>
          ` : ''}
        </div>
      </div>
      
      ${contactLinks.length > 0 ? `
        <div class="group-member-contacts">
          ${contactLinks.join('')}
        </div>
      ` : ''}
    </div>
    
    <style>
      /* Group Member Item Styles */
      .group-member-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: white;
        border-radius: 8px;
        border: 1px solid var(--color-neutral-200);
        transition: all 0.2s ease;
      }

      .group-member-item:hover {
        background: var(--color-neutral-100);
        border-color: var(--color-neutral-300);
        transform: translateX(2px);
      }

      .group-member-item--leader {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(217, 119, 6, 0.05));
        border-color: rgba(245, 158, 11, 0.3);
      }

      .group-member-item--leader:hover {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
        border-color: rgba(245, 158, 11, 0.4);
      }

      .group-member-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
      }

      .group-member-avatar-container {
        position: relative;
        flex-shrink: 0;
      }

      .group-member-item-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .group-member-leader-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .group-member-leader-badge i {
        font-size: 0.5rem;
        color: white;
      }

      .group-member-details {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .group-member-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-neutral-800);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .group-member-pronouns {
        font-size: 0.75rem;
        color: var(--color-neutral-600);
        font-style: italic;
      }

      .group-member-contacts {
        display: flex;
        gap: 0.25rem;
        flex-shrink: 0;
      }

      .group-member-contact {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--color-neutral-200);
        color: var(--color-neutral-600);
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 0.75rem;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .group-member-contact:hover,
      .group-member-contact:focus {
        background: #8b5cf6;
        color: white;
        border-color: #7c3aed;
        transform: scale(1.1);
      }

      /* Responsive Design */
      @media (max-width: 480px) {
        .group-member-item {
          padding: 0.5rem;
        }

        .group-member-item-avatar {
          width: 32px;
          height: 32px;
        }

        .group-member-leader-badge {
          width: 14px;
          height: 14px;
          top: -2px;
          right: -2px;
        }

        .group-member-leader-badge i {
          font-size: 0.4rem;
        }

        .group-member-contact {
          width: 28px;
          height: 28px;
          font-size: 0.625rem;
        }
      }

      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        .group-member-item,
        .group-member-contact {
          transition: none;
        }
        
        .group-member-item:hover {
          transform: none;
        }
        
        .group-member-contact:hover,
        .group-member-contact:focus {
          transform: none;
        }
      }
    </style>
  `;
}
=======
>>>>>>> origin/develop
