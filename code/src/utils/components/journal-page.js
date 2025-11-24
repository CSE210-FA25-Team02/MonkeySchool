/**
 * Journal Page Components
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Create the main Journal layout
 * @param {Array} entries - List of journal entries
 * @returns {string} HTML string
 */
export function createJournalPage(entries) {
  return `
    <div class="journal-container">
      <header class="journal-header">
        <h1>My Journal</h1>
        <button
          hx-get="/journal/new"
          hx-target="#journal-content"
          hx-swap="innerHTML"
          class="btn btn--primary">
          + New Entry
        </button>
      </header>

      <div class="journal-layout">
        <aside class="journal-sidebar">
          <h3>History</h3>
          <div id="journal-list" class="journal-list">
            ${createJournalList(entries)}
          </div>
        </aside>

        <main id="journal-content" class="journal-main">
          <div class="empty-state">
            <p>Select an entry from the history or create a new one.</p>
          </div>
        </main>
      </div>
    </div>
  `;
}

/**
 * Create the list of journal entries for the sidebar
 * @param {Array} entries - List of journal entries
 * @returns {string} HTML string
 */
export function createJournalList(entries) {
  if (!entries || entries.length === 0) {
    return `<p class="text-muted">No entries yet.</p>`;
  }

  return entries
    .map(
      (entry) => `
    <div class="journal-list-item"
         hx-get="/journal/${entry.id}"
         hx-target="#journal-content"
         hx-swap="innerHTML"
         tabindex="0"
         role="button">
      <div class="journal-list-item__date">${new Date(entry.createdAt).toLocaleDateString()}</div>
      <div class="journal-list-item__title">${escapeHtml(entry.title || "Untitled")}</div>
    </div>
  `,
    )
    .join("");
}

/**
 * Create the view for a single journal entry
 * @param {Object} entry - The journal entry
 * @returns {string} HTML string
 */
export function createJournalEntryView(entry) {
  return `
    <article class="journal-entry">
      <header class="journal-entry__header">
        <h1 class="journal-entry__title">${escapeHtml(entry.title || "Untitled")}</h1>
        <div class="journal-entry__meta">
          <span>${new Date(entry.createdAt).toLocaleString()}</span>
          <div class="journal-entry__actions">
            <button
              hx-get="/journal/${entry.id}/edit"
              hx-target="#journal-content"
              class="btn btn--secondary btn--sm">
              Edit
            </button>
            <button
              hx-delete="/journal/${entry.id}"
              hx-confirm="Are you sure you want to delete this entry?"
              hx-target="#journal-list"
              class="btn btn--danger btn--sm">
              Delete
            </button>
          </div>
        </div>
      </header>

      <section class="journal-entry__section">
        <h3>Work Done</h3>
        <div class="journal-entry__content">
          ${escapeHtml(entry.workLog).replace(/\n/g, "<br>")}
        </div>
      </section>

      <section class="journal-entry__section">
        <h3>Emotional Reflection</h3>
        <div class="journal-entry__content">
          ${escapeHtml(entry.reflection).replace(/\n/g, "<br>")}
        </div>
      </section>
    </article>
  `;
}

/**
 * Create the edit/create form for a journal entry
 * @param {Object} [entry] - The existing entry (optional)
 * @returns {string} HTML string
 */
export function createJournalEntryForm(entry = {}) {
  const isEdit = !!entry.id;
  const url = isEdit ? `/journal/${entry.id}` : "/journal";
  const method = isEdit ? "put" : "post";

  return `
    <form
      hx-${method}="${url}"
      hx-target="#journal-content"
      class="journal-form">

      <div class="form-group">
        <input
          type="text"
          name="title"
          class="journal-input--title"
          placeholder="Untitled"
          value="${escapeHtml(entry.title || "")}"
        >
      </div>

      <div class="form-group">
        <label for="workLog">Work Done</label>
        <textarea
          id="workLog"
          name="workLog"
          class="journal-textarea"
          placeholder="What did you accomplish today?"
          rows="6"
          required
        >${escapeHtml(entry.workLog || "")}</textarea>
      </div>

      <div class="form-group">
        <label for="reflection">Emotional Reflection</label>
        <textarea
          id="reflection"
          name="reflection"
          class="journal-textarea"
          placeholder="How are you feeling about yourself, the team, or the course?"
          rows="6"
          required
        >${escapeHtml(entry.reflection || "")}</textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn--primary">Save</button>
        <button
          type="button"
          class="btn btn--secondary"
          ${
            isEdit
              ? `hx-get="/journal/${entry.id}"`
              : `onclick="document.getElementById('journal-content').innerHTML = '<div class=\'empty-state\'><p>Select an entry from the history or create a new one.</p></div>'"`
          }
          hx-target="#journal-content">
          Cancel
        </button>
      </div>
    </form>
  `;
}