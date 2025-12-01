/**
 * HTML Template Utilities for HTMX Responses
 *
 * Provides functions to generate accessible, internationalized HTML components
 */

/**
 * Creates the base HTML document structure
 * @param {string} title Page title text
 * @param {string} content HTML string to inject into the main content area
 * @param {object} [options={}] Optional layout configuration
 * @param {string} [options.lang='en'] Language attribute for the document
 * @param {string} [options.dir='ltr'] Text direction for the document
 * @param {string} [options.charset='UTF-8'] Character encoding
 * @param {string} [options.viewport='width=device-width, initial-scale=1.0'] Viewport meta tag
 * @param {string} [options.description='Student Management System'] Meta description
 * @returns {string} HTML string for the full page layout
 */
export function createBaseLayout(title, content, options = {}) {
  const {
    lang = "en",
    dir = "ltr",
    charset = "UTF-8",
    viewport = "width=device-width, initial-scale=1.0",
    description = "Student Management System",
    user = null,
  } = options;

  // Derive simple user display data for header pill
  const displayName = escapeHtml(user?.name || "User");
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return `
<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
    <meta charset="${charset}">
    <meta name="viewport" content="${viewport}">
    <meta name="description" content="${description}">
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
    
    <!-- Design System Styles -->
    <link rel="stylesheet" href="/css/tokens.css">
    <link rel="stylesheet" href="/css/shell.css">
    <link rel="stylesheet" href="/css/components/bento.css">
    <link rel="stylesheet" href="/css/components/modal.css">
    <link rel="stylesheet" href="/css/components/toast.css">
    <!-- Page Specific Styles -->
    <link rel="stylesheet" href="/css/pages/class-list.css">
    <link rel="stylesheet" href="/css/pages/profile.css">
    <link rel="stylesheet" href="/css/pages/availability.css">
    <link rel="stylesheet" href="/css/pages/schedule.css">
    <!-- Legacy support for specific pages until migrated -->
    <link rel="stylesheet" href="/css/pages/attendance.css">

    <!-- Application Scripts -->
    <script type="module" src="/js/app.js" defer></script>
</head>
<body>
    <div class="app-shell">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="brand-mark">
                <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <nav class="nav-menu">
                <a href="/" class="nav-item ${title === "Dashboard" ? "active" : ""}" title="Dashboard">
                    <i class="fa-solid fa-grip-vertical nav-icon"></i>
                </a>
                <a href="/classes" class="nav-item ${title === "Classes" ? "active" : ""}" title="My Classes">
                    <i class="fa-solid fa-book-open nav-icon"></i>
                </a>
                <a href="/attendance" class="nav-item ${title === "Attendance" ? "active" : ""}" title="Attendance">
                    <i class="fa-solid fa-clipboard-user nav-icon"></i>
                </a>
                <a href="/availability" class="nav-item ${title === "Availability" ? "active" : ""}" title="My Groups">
                    <i class="fa-solid fa-users-rectangle nav-icon"></i>
                </a>
                <a href="/users/profile" class="nav-item ${title === "Profile" ? "active" : ""}" title="Settings">
                    <i class="fa-solid fa-gear nav-icon"></i>
                </a>
            </nav>
            
            <div style="margin-top: auto; padding-bottom: 24px;">
                <button 
                    type="button" 
                    class="nav-item" 
                    title="Logout" 
                    style="background:none; border:none; cursor:pointer; width: 48px; height: 48px;"
                    onclick="openModal('modal-logout')"
                >
                    <i class="fa-solid fa-arrow-right-from-bracket nav-icon"></i>
                </button>
            </div>
        </aside>

        <!-- Main Content Canvas -->
        <main class="main-content" id="main-content">
            <header class="top-bar">
                <div class="breadcrumbs">
                    <a href="/">Dashboard</a>
                    <span style="color: var(--color-text-muted)">/</span>
                    <span class="current">${escapeHtml(title)}</span>
                </div>
                
                <div class="top-actions">
                     <!-- User Profile Pill -->
                    <a href="/users/profile" class="user-pill" style="text-decoration: none; color: inherit;">
                        <div class="user-avatar">
                             ${initials}
                        </div>
                        <span class="user-name">${displayName}</span>
                    </a>
                </div>
            </header>

            <div class="content-canvas">
                <div class="container">
                    ${content}
                </div>
            </div>
        </main>
    </div>
    
    <!-- Logout Confirmation Modal -->
    <div id="modal-logout" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Sign out</h3>
          <button class="btn-close" onclick="closeModal('modal-logout')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 8px;">Are you sure you want to log out?</p>
          <p style="font-size: 12px; color: var(--color-text-muted);">
            You can sign back in anytime using your UCSD email.
          </p>
        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn--secondary" 
            onclick="closeModal('modal-logout')"
          >
            Cancel
          </button>
          <button 
            type="button" 
            class="btn btn--primary"
            onclick="handleLogoutConfirm()"
          >
            Log out
          </button>
        </div>
      </div>
    </div>

    <script>
      window.handleLogoutConfirm = function () {
        // Close modal immediately for snappy UX
        if (typeof closeModal === "function") {
          closeModal("modal-logout");
        }

        // Prefer HTMX for partial swap if available
        if (typeof htmx !== "undefined") {
          htmx.ajax("GET", "/auth/logout", { target: "body", swap: "outerHTML" });
        } else {
          window.location.href = "/auth/logout";
        }
      };
    </script>

    <!-- Toast Container -->
    <div id="toast-container" class="toast-container"></div>
</body>
</html>
  `;
}

/**
 * Creates an error message component (Toast style)
 * @param {string} message Error message
 * @param {Array|null} [errors=null] List of error items
 * @returns {string} HTML string for error message
 */
export function createErrorMessage(message, errors = null) {
  const details = errors ? errors.join(", ") : "";
  // We return a script that triggers the toast because HTMX often injects this HTML
  return `
    <div class="alert alert--error" role="alert">
        <strong>Error:</strong> ${escapeHtml(message)}
        ${details ? `<br><small>${escapeHtml(details)}</small>` : ""}
    </div>
    <script>
        if (window.showToast) {
            window.showToast('Error', '${escapeHtml(message)}', 'error');
        }
    </script>
  `;
}

/**
 * Creates a success message component (Toast style)
 * @param {string} message Success message
 * @returns {string} HTML string for success message
 */
export function createSuccessMessage(message) {
  return `
    <div class="alert alert--success" role="alert">
        ${escapeHtml(message)}
    </div>
    <script>
        if (window.showToast) {
            window.showToast('Success', '${escapeHtml(message)}', 'success');
        }
    </script>
  `;
}

/**
 * Utility functions
 * @param {string|null|undefined} text Input text to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(text) {
  if (text == null) return "";
  if (typeof text !== "string") return String(text);
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Format date string
 * @param {string} dateString ISO date string to format
 * @param {string} [lang='en'] Language code for formatting rule
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, lang = "en") {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get upcoming quarters list
 * @param {number} [count=8] Number of quarters to include
 * @returns {Array<string>} List of upcoming quarters
 */
export function getUpcomingQuarters(count = 8) {
  const quarters = ["WI", "SP", "SU", "FA"];
  const quarterNames = { WI: "Winter", SP: "Spring", SU: "Summer", FA: "Fall" };
  const currDate = new Date();
  const currYear = currDate.getFullYear();
  const currMonth = currDate.getMonth();

  //What is the current quarter (0 to 2 = Winter, 3 to 5 = Spring, 6 to 7 = Summer, 8 to 12 = Fall)
  let startIndex =
    currMonth < 3 ? 0 : currMonth < 6 ? 1 : currMonth < 8 ? 2 : 3;

  const quarterList = [];
  let yearIndex = currYear;
  let qIndex = startIndex;

  for (let i = 0; i < count; i++) {
    const shortYear = yearIndex % 100;
    const code = `${quarters[qIndex]}${shortYear}`;
    const full = `${quarterNames[quarters[qIndex]]} ${yearIndex}`;
    quarterList.push({ code, full });
    qIndex++;

    if (qIndex === quarters.length) {
      qIndex = 0;
      yearIndex++;
    }
  }

  return quarterList;
}
