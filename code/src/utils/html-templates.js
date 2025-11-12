/**
 * HTML Template Utilities for HTMX Responses
 *
 * Provides functions to generate accessible, internationalized HTML components
 */

/**
 * Creates the base HTML document structure
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
    <title>${title}</title>
    
    <!-- HTMX Library -->
    <script src="https://unpkg.com/htmx.org@1.9.8"></script>
    
    <!-- Custom Styles -->
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/profile-page.css">
    <link rel="stylesheet" href="/css/classes-modal.css">
    
    <!-- Accessibility Features -->
    <meta name="theme-color" content="#2563eb">
    <meta name="color-scheme" content="light dark">
</head>
<body>
    <!-- Skip to main content for screen readers -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <main id="main-content" class="main" role="main" tabindex="-1">
        ${content}
    </main>

    <!-- Loading indicator for HTMX requests -->
    <div id="loading" class="loading" aria-live="polite" aria-atomic="true" style="display: none;">
        <div class="loading__spinner" role="status">
            <span class="sr-only">Loading content, please wait...</span>
        </div>
    </div>

    <script>
        // Remove added profile link fields
        document.body.addEventListener('click', (evt) => {
            const btn = evt.target.closest('[data-action="remove-profile-link-field"]');
            if (!btn) return;

            evt.preventDefault();
            btn.closest('.profile-link-field')?.remove();
        });
    </script>
</body>
</html>`;
}

/**
 * Creates an error message component
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
            `
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

export function formatDate(dateString, lang = "en") {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
