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
    
    <!-- Accessibility Features -->
    <meta name="theme-color" content="#2563eb">
    <meta name="color-scheme" content="light dark">
</head>
<body>
    <!-- Skip to main content for screen readers -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <header class="header" role="banner">
        <div class="container">
            <h1 class="header__title">
                <a href="/" class="header__link">Student Management System</a>
            </h1>
            <nav class="header__nav" role="navigation" aria-label="Main navigation">
                <ul class="nav-list">
                    <li class="nav-list__item">
                        <a href="/students" class="nav-list__link" hx-get="/api/students" hx-target="#main-content">
                            Students
                        </a>
                    </li>
                    <li class="nav-list__item">
                        <a href="/students/new" class="nav-list__link" hx-get="/api/students/new" hx-target="#main-content">
                            Add Student
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    </header>

    <main id="main-content" class="main" role="main" tabindex="-1">
        ${content}
    </main>

    <footer class="footer" role="contentinfo">
        <div class="container">
            <p class="footer__text">
                &copy; 2024 Student Management System. 
                <span class="footer__accessibility">
                    Built with accessibility and internationalization in mind.
                </span>
            </p>
        </div>
    </footer>

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
 * Creates a student card component
 */
export function createStudentCard(student, options = {}) {
  const { editable = false, lang = "en" } = options;

  return `
<article class="student-card" 
         role="article" 
         aria-labelledby="student-${student.id}-name"
         data-student-id="${student.id}">
    <div class="student-card__header">
        <h3 class="student-card__name" id="student-${student.id}-name">
            ${escapeHtml(student.name)}
        </h3>
        <p class="student-card__email" aria-label="Email address">
            <a href="mailto:${escapeHtml(student.email)}" 
               class="student-card__email-link">
                ${escapeHtml(student.email)}
            </a>
        </p>
    </div>
    
    <div class="student-card__meta">
        <time class="student-card__date" 
              datetime="${student.createdAt}"
              aria-label="Registration date">
            Registered: ${formatDate(student.createdAt, lang)}
        </time>
    </div>
    
    ${
      editable
        ? `
    <div class="student-card__actions" role="group" aria-label="Student actions">
        <button type="button" 
                class="btn btn--secondary"
                hx-get="/api/students/${student.id}/edit"
                hx-target="#main-content"
                aria-label="Edit ${escapeHtml(student.name)}">
            Edit
        </button>
        <button type="button" 
                class="btn btn--danger"
                hx-delete="/api/students/${student.id}"
                hx-confirm="Are you sure you want to delete ${escapeHtml(student.name)}? This action cannot be undone."
                hx-target="closest .student-card"
                hx-swap="outerHTML"
                aria-label="Delete ${escapeHtml(student.name)}">
            Delete
        </button>
    </div>
    `
        : ""
    }
</article>`;
}

/**
 * Creates a student form component
 */
export function createStudentForm(student = null, options = {}) {
  const {
    action = student ? `/api/students/${student.id}` : "/api/students",
    method = student ? "put" : "post",
    title = student ? "Edit Student" : "Add New Student",
  } = options;

  return `
<section class="form-section" role="region" aria-labelledby="form-title">
    <h2 id="form-title" class="form-section__title">${title}</h2>
    
    <form class="student-form" 
          hx-${method}="${action}"
          hx-target="#main-content"
          hx-swap="innerHTML"
          novalidate
          aria-describedby="form-description">
        
        <p id="form-description" class="form__description">
            ${student ? "Update the information below to modify the student record." : "Fill in the information below to create a new student record."}
        </p>
        
        <div class="form-group">
            <label for="student-name" class="form-group__label">
                Name <span class="required" aria-label="required">*</span>
            </label>
            <input type="text" 
                   id="student-name" 
                   name="name" 
                   class="form-group__input"
                   value="${student ? escapeHtml(student.name) : ""}"
                   required
                   aria-required="true"
                   aria-describedby="name-help name-error"
                   maxlength="255">
            <div id="name-help" class="form-group__help">
                Enter the student's full name (maximum 255 characters)
            </div>
            <div id="name-error" class="form-group__error" role="alert" aria-live="polite"></div>
        </div>
        
        <div class="form-group">
            <label for="student-email" class="form-group__label">
                Email Address <span class="required" aria-label="required">*</span>
            </label>
            <input type="email" 
                   id="student-email" 
                   name="email" 
                   class="form-group__input"
                   value="${student ? escapeHtml(student.email) : ""}"
                   required
                   aria-required="true"
                   aria-describedby="email-help email-error"
                   maxlength="255">
            <div id="email-help" class="form-group__help">
                Enter a valid email address for the student
            </div>
            <div id="email-error" class="form-group__error" role="alert" aria-live="polite"></div>
        </div>
        
        <div class="form-actions">
            <button type="submit" class="btn btn--primary">
                ${student ? "Update Student" : "Create Student"}
            </button>
            <button type="button" 
                    class="btn btn--secondary"
                    hx-get="/api/students"
                    hx-target="#main-content">
                Cancel
            </button>
        </div>
    </form>
</section>`;
}

/**
 * Creates a student list component
 */
export function createStudentList(students, pagination = null, options = {}) {
  const { editable = true } = options;

  if (!students || students.length === 0) {
    return `
<section class="empty-state" role="region" aria-labelledby="empty-title">
    <h2 id="empty-title" class="empty-state__title">No Students Found</h2>
    <p class="empty-state__message">
        There are currently no students in the system.
    </p>
    <a href="/students/new" 
       class="btn btn--primary"
       hx-get="/api/students/new"
       hx-target="#main-content">
        Add Your First Student
    </a>
</section>`;
  }

  return `
<section class="student-list" role="region" aria-labelledby="list-title">
    <header class="student-list__header">
        <h2 id="list-title" class="student-list__title">
            Students (${pagination?.total || students.length})
        </h2>
        <a href="/students/new" 
           class="btn btn--primary"
           hx-get="/api/students/new"
           hx-target="#main-content">
            Add New Student
        </a>
    </header>
    
    <div class="student-grid" role="list">
        ${students
          .map((student) => createStudentCard(student, { editable }))
          .join("")}
    </div>
    
    ${pagination ? createPagination(pagination) : ""}
</section>`;
}

/**
 * Creates pagination component
 */
export function createPagination(pagination) {
  if (pagination.pages <= 1) return "";

  const { page, pages, total } = pagination;
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < pages ? page + 1 : null;

  return `
<nav class="pagination" role="navigation" aria-label="Student list pagination">
    <div class="pagination__info">
        Showing page ${page} of ${pages} (${total} total students)
    </div>
    
    <ul class="pagination__list">
        ${
          prevPage
            ? `
        <li class="pagination__item">
            <a href="/api/students?page=${prevPage}" 
               class="pagination__link"
               hx-get="/api/students?page=${prevPage}"
               hx-target="#main-content"
               aria-label="Go to previous page">
                ← Previous
            </a>
        </li>
        `
            : ""
        }
        
        ${Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages)
          .map(
            (p) => `
            <li class="pagination__item">
                ${
                  p === page
                    ? `
                <span class="pagination__link pagination__link--current" 
                      aria-current="page"
                      aria-label="Current page, page ${p}">
                    ${p}
                </span>
                `
                    : `
                <a href="/api/students?page=${p}" 
                   class="pagination__link"
                   hx-get="/api/students?page=${p}"
                   hx-target="#main-content"
                   aria-label="Go to page ${p}">
                    ${p}
                </a>
                `
                }
            </li>
          `,
          )
          .join("")}
        
        ${
          nextPage
            ? `
        <li class="pagination__item">
            <a href="/api/students?page=${nextPage}" 
               class="pagination__link"
               hx-get="/api/students?page=${nextPage}"
               hx-target="#main-content"
               aria-label="Go to next page">
                Next →
            </a>
        </li>
        `
            : ""
        }
    </ul>
</nav>`;
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
    if (text == null || text == undefined) return ""
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
