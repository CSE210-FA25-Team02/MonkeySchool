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
  } = options;
  return `
<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
    <meta charset="${charset}">
    <meta name="viewport" content="${viewport}">
    <meta name="description" content="${description}">
    <title>${escapeHtml(title)} - Monkey School</title>
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
 * Creates an error message component
 * @param {string} message Error message
 * @param {Array|null} [errors=null] List of error items
 * @returns {string} HTML string for error message
 */
export function createErrorMessage(message, errors = null) {
  return `
<div class="alert alert--error" role="alert" aria-live="assertive">
    <h2 class="alert__title">Error</h2>
    <p class="alert__message">${escapeHtml(message)}</p>
    ${
      errors
        ? `
    <details class="alert__details">
        <summary>Error Details</summary>
        <ul class="alert__list">
            ${errors
              .map(
                (error) => `
                <li class="alert__item">${escapeHtml(error)}</li>
            `,
              )
              .join("")}
        </ul>
    </details>
    `
        : ""
    }
</div>`;
}

/**
 * Creates a success message component
 * @param {string} message Success message
 * @returns {string} HTML string for success message
 */
export function createSuccessMessage(message) {
  return `
<div class="alert alert--success" role="alert" aria-live="polite">
    <h2 class="alert__title">Success</h2>
    <p class="alert__message">${escapeHtml(message)}</p>
</div>`;
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
    quarterList.push(`${quarters[qIndex]}${shortYear}`);
    qIndex++;

    if (qIndex === quarters.length) {
      qIndex = 0;
      yearIndex++;
    }
  }

  return quarterList;
}
