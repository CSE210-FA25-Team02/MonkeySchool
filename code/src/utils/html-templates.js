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
        <div class="container">
            ${content}
        </div>
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
 * Create User Profile Page Component
 */
export function createUserProfile(user, { mode = "view" } = {}) {
    if (!user) {
        return `
    <section class="profile-page profile-page--empty">
    <article class="profile-field">
        <h2 class="profile-field__label">User profile unavailable</h2>
        <p class="profile-field__value">User not found.</p>
    </article>
    </section>`;
    }

    const {
        id,
        name = "Unnamed User",
        email = "",
        preferredName = "",
        pronunciation = "",
        pronouns = "",
        phone = "",
        bio = "",
        socialLinks = [],
        chatLinks = [],
    } = user;

    const isEdit = mode === "edit";
    const safe = (v) => (v ? escapeHtml(v) : "—");
    const href = (v) => (v.startsWith("http") ? v : `https://${v}`);

    const field = (label, nameAttr, value, type = "text", placeholder = "") =>
        isEdit
        ? `
        <fieldset class="profile-field">
            <label class="profile-field__label" for="${nameAttr}-${id}">${label}</label>
            <input id="${nameAttr}-${id}" name="${nameAttr}" type="${type}"
                value="${escapeHtml(value)}"
                placeholder="${placeholder}"
                class="profile-field__input">
        </fieldset>`
        : `
        <section class="profile-field">
            <h3 class="profile-field__label">${label}</h3>
            <p class="profile-field__value profile-field__value--text">${safe(value)}</p>
        </section>`;

    const renderLinks = (links, type) =>
        isEdit
        ? `
        <fieldset id="${type}-links-${id}" class="profile-link-fields">
            ${(links || [""]).map((l) => createProfileLinkField(l, { type })).join("")}
        </fieldset>
        <button type="button"
                class="btn btn--add-item"
                hx-get="/api/users/${id}/profile/link-field?type=${type}"
                hx-target="#${type}-links-${id}"
                hx-swap="beforeend">
            + Add ${type === "chat" ? "Chat" : "Social"} Link
        </button>`
        : `
        <ul class="profile-link-list">
            ${
            links.length
                ? links
                    .map(
                    (l) => `
                <li class="profile-link-item">
                <a href="${href(l)}" class="profile-link-item__link" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(l)}
                </a>
                </li>`
                    )
                    .join("")
                : `<li class="profile-link-item profile-link-item--empty">—</li>`
            }
        </ul>`;

    const header = `
    <header class="profile-hero">
    <figure class="profile-hero__avatar">
        <img src="/img/default-avatar.svg"
            alt="${safe(name)}"
            class="profile-hero__photo profile-hero__photo--default">
    </figure>
    <div class="profile-hero__info">
        <h1 class="profile-hero__name">${safe(name)}</h1>
        <address class="profile-hero__email">
        <a href="mailto:${escapeHtml(email)}" class="profile-hero__email-link">${escapeHtml(email)}</a>
        </address>
    </div>
    <nav class="profile-hero__actions" aria-label="Profile actions">
        ${
        isEdit
            ? `
        <button type="submit" form="profile-form-${id}" class="btn btn--primary profile-hero__save">
            Save
        </button>
        <button type="button" class="btn btn--secondary"
                hx-get="/api/users/${id}/profile"
                hx-target="#main-content"
                hx-push-url="true">Cancel</button>`
            : `
        <a href="/api/users/${id}/profile?mode=edit"
            hx-get="/api/users/${id}/profile?mode=edit"
            hx-target="#main-content"
            hx-push-url="true"
            class="btn btn--primary profile-hero__edit">Edit</a>`
        }
    </nav>
    </header>`;

    const bodyOpen = isEdit
        ? `<form id="profile-form-${id}" class="profile-content"
                hx-put="/api/users/${id}"
                hx-target="#main-content"
                hx-swap="innerHTML">`
        : `<main class="profile-content profile-content--view">`;
    const bodyClose = isEdit ? `</form>` : `</main>`;

    return `
    <section class="profile-page" id="user-${id}">
    ${header}
    ${bodyOpen}
        <article class="profile-section">
        <header class="profile-section__header">
            <h2 class="profile-section__title">About Me</h2>
        </header>
        ${
            isEdit
            ? `<textarea name="bio" class="profile-textarea" rows="3" maxlength="800"
                        placeholder="Add a short introduction about yourself.">${escapeHtml(bio)}</textarea>`
            : `<p class="profile-section__text">${
                bio
                    ? escapeHtml(bio)
                    : '<span class="profile-section__placeholder">Add a short introduction about yourself.</span>'
                }</p>`
        }
        </article>

        <hr class="profile-divider">

        <section class="profile-grid profile-grid--two profile-grid--details" aria-label="Personal details">
        ${field("Preferred Name", "preferredName", preferredName, "text", "Your preferred name")}
        ${field("Pronunciation", "pronunciation", pronunciation, "text", "Your pronunciation")}
        ${field("Pronouns", "pronouns", pronouns, "text", "Your pronouns")}
        ${field("Phone Number", "phone", phone, "tel", "(999) 123-4567")}
        </section>

        <hr class="profile-divider">

        <section class="profile-section profile-section--contact" aria-label="Contact Links">
        <header class="profile-section__header">
            <h2 class="profile-section__title">Contact Links</h2>
        </header>
        <div class="profile-section__links">
            <section class="profile-section__links-group">
            <h3 class="profile-field__label">External Socials</h3>
            ${renderLinks(socialLinks, "social")}
            </section>
            <section class="profile-section__links-group">
            <h3 class="profile-field__label">Class Chat Links</h3>
            ${renderLinks(chatLinks, "chat")}
            </section>
        </div>
        </section>
    ${bodyClose}
    </section>`;
}

/**
 * Create profile link text field
 */
export function createProfileLinkField(link = "", { type = "social" } = {}) {
    const placeholderLabel = type === "chat" ? "chat" : "social";
    return `
    <fieldset class="profile-link-field">
    <input type="text" name="${type}Links[]" value="${escapeHtml(link)}"
            class="profile-link-field__input"
            placeholder="Paste ${placeholderLabel} link or leave blank">
    <button type="button"
            class="profile-link-field__remove"
            data-action="remove-profile-link-field"
            aria-label="Remove link field">×</button>
    </fieldset>`;
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
  if (typeof text !== "string") return text;

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
