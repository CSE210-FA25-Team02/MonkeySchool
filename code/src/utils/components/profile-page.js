/**
 * Create User Profile Page Component
 * @param {Object} user User containing profile information
 * @param {Object} [options={}] Display options
 * @param {'view'|'edit'} [options.mode='view'] Profile read/edit mode
 * @returns {string} HTML profile page
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
  /**
   * Escape HTML
   * @param {string|null|undefined} v Value to escape
   * @returns {string} Escaped HTML
   */
  const safe = (v) => (v ? escapeHtml(v) : "—");
  /**
   * Normalize URL
   * @param {string} v URL string
   * @returns {string} URL with protocol
   */
  const href = (v) => (v.startsWith("http") ? v : `https://${v}`);

  /**
   * Generate form field HTML (edit or view mode)
   * @param {string} label Field label
   * @param {string} nameAttr Input name attribute
   * @param {string} value Field value
   * @param {string} [type='text'] Input type
   * @param {string} [placeholder=''] Placeholder text
   * @returns {string} HTML for field
   */
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

  /**
   * Render social/chat links section (edit or view mode)
   * @param {Array<string>} links Array of link URLs
   * @param {'social'|'chat'} type Link type
   * @returns {string} HTML for links section
   */
  const renderLinks = (links, type) =>
    isEdit
      ? `
        <fieldset id="${type}-links-${id}" class="profile-link-fields">
            ${(links || [""]).map((l) => createProfileLinkField(l, { type })).join("")}
        </fieldset>
        <button type="button"
                class="btn btn--add-item"
                hx-get="/users/${id}/profile/link-field?type=${type}"
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
                </li>`,
                    )
                    .join("")
                : `<li class="profile-link-item profile-link-item--empty">—</li>`
            }
        </ul>`;

  const avatarSrc =
    user.photoUrl && !user.photoUrl.includes("default")
      ? user.photoUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=120`;

  const header = `
    <header class="profile-hero">
    <figure class="profile-hero__avatar">
        <img 
            src="${avatarSrc}"
            alt="${safe(name)}"
            class="profile-hero__photo"
            style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover;"
            onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=120';"
        >
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
            ? `<button type="submit" form="profile-form-${id}" class="btn btn--primary profile-hero__save">Save</button>
            <button type="button" class="btn btn--secondary"
                    hx-get="/users/profile"
                    hx-target="#main-content"
                    hx-push-url="true">Cancel</button>`
            : `<a href="/users/profile?mode=edit"
            hx-get="/users/profile?mode=edit"
            hx-target="#main-content"
            hx-push-url="true"
            class="btn btn--primary profile-hero__edit">Edit</a>`
        }
    </nav>
    </header>`;

  const containerOpen = `<section class="profile-content-container${isEdit ? " profile-content-container--edit" : " profile-content-container--view"}">`;
  const containerClose = `</section>`;
  const bodyOpen = isEdit
    ? `<form id="profile-form-${id}" class="profile-content profile-content--edit profile-content__form"
                hx-put="/users/${id}"
                hx-target="#main-content"
                hx-swap="innerHTML">`
    : `<div class="profile-content profile-content--view">`;
  const bodyClose = isEdit ? `</form>` : `</div>`;

  return `
    <section class="profile-page" id="user-${id}">
    ${header}
    ${containerOpen}
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
    ${containerClose}
    </section>`;
}

/**
 * Create profile link text field
 * @param {string} [link=''] Link URL value
 * @param {Object} [options={}] Field options
 * @param {'social'|'chat'} [options.type='social'] Link type
 * @returns {string} HTML input field
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
 * Utility functions
 * @param {string} text Text value to clean
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
