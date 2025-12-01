/**
 * HTMX Templates for Dashboard
 * code/src/utils/htmx-templates/dashboard-templates.js
 */

import { escapeHtml, getUpcomingQuarters } from "../html-templates.js";

/**
 * Create the main dashboard HTML
 * @param {Object} user - User object
 * @param {Array} recentClasses - List of recent classes
 * @param {Array} upcomingEvents - List of upcoming events
 * @returns {string} HTML string
 */
export function createDashboard(user, recentClasses = [], upcomingEvents = []) {
  // Get user's first name for greeting, fallback to 'Student' for demo mode
  const displayName =
    user && user.name ? escapeHtml(user.name.split(" ")[0]) : "Student";
  return `
    <div class="bento-grid">
        <!-- Welcome Card -->
        <div class="bento-card span-2 card-welcome">
            <div class="card-content">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Welcome back, ${displayName}</h2>
                <p style="opacity: 0.9;">Ready to monkey around with some code?</p>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bento-card span-1">
            <div class="card-header">
                <div class="card-title"><i class="fa-solid fa-bolt"></i> Actions</div>
            </div>
            <div class="card-content" style="display: flex; flex-direction: column; gap: 12px;">
                <button 
                    class="btn btn--primary btn--full" 
                    onclick="openModal('modal-create-class')"
                    style="justify-content: center;"
                >
                    <i class="fa-solid fa-plus"></i> Create Class
                </button>
                <button 
                    class="btn btn--secondary btn--full" 
                    onclick="openModal('modal-quick-journal')"
                    style="justify-content: center;"
                >
                    <i class="fa-solid fa-pen-to-square"></i> Work Journal
                </button>
            </div>
        </div>

        <!-- Stats / Punch Card -->
        <div class="bento-card span-1" style="background: var(--color-brand-light); color: var(--color-brand-deep);">
            <div class="card-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 32px; margin-bottom: 8px;"><i class="fa-solid fa-fire"></i></div>
                <div style="font-weight: bold; font-size: 24px;">3 Days</div>
                <div style="font-size: 12px; opacity: 0.8;">Streak</div>
            </div>
        </div>

        <!-- Recent Classes -->
        <div class="bento-card span-2 row-span-2">
            <div class="card-header">
                <div class="card-title"><i class="fa-solid fa-book-open"></i> My Classes</div>
                <a href="/classes" class="card-action">View All</a>
            </div>
            <div class="card-content">
                ${renderRecentClassesList(recentClasses)}
            </div>
        </div>

        <!-- Upcoming Events -->
        <div class="bento-card span-2">
            <div class="card-header">
                <div class="card-title"><i class="fa-regular fa-calendar"></i> Upcoming</div>
            </div>
            <div class="card-content">
                ${renderUpcomingEvents(upcomingEvents)}
            </div>
        </div>
    </div>

    <!-- Create Class Modal (Hidden by default) -->
    ${createCreateClassModal(getUpcomingQuarters())}
    
    <!-- Quick Journal Modal -->
    ${createQuickJournalModal()}
  `;
}

/**
 * Render upcoming events list on the dashboard.
 *
 * @param {Array} events - List of upcoming event objects
 * @returns {string} HTML string
 */
function renderUpcomingEvents(events) {
  if (!events || events.length === 0) {
    return `<div style="text-align: center; padding: 16px; color: var(--color-text-muted);">No upcoming events</div>`;
  }

  const iconMap = {
    lecture: {
      icon: "fa-book-open",
      bg: "#E0F2FE",
      color: "#0284C7",
    },
    meeting: {
      icon: "fa-user-group",
      bg: "#F3E8FF",
      color: "#7C3AED",
    },
    "office-hours": {
      icon: "fa-clock",
      bg: "#FEF3C7",
      color: "#D97706",
    },
    default: {
      icon: "fa-calendar",
      bg: "#E5E7EB",
      color: "#6B7280",
    },
  };

  return events
    .map((e) => {
      const style = iconMap[e.type] || iconMap.default;
      return `
            <div class="list-item">
                <div class="list-item-icon" style="background: ${style.bg}; color: ${style.color};">
                    <i class="fa-solid ${style.icon}"></i>
                </div>
                <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(e.title)}</div>
                    <div class="list-item-subtitle">${escapeHtml(e.date)}, ${escapeHtml(e.time)}</div>
                </div>
            </div>
        `;
    })
    .join("");
}

/**
 * Render recent classes list on the dashboard.
 *
 * @param {Array} classes - List of class summary objects
 * @returns {string} HTML string
 */
function renderRecentClassesList(classes) {
  if (!classes || classes.length === 0) {
    return `
            <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">
                <p>No classes yet.</p>
                <button class="btn btn--text" onclick="openModal('modal-create-class')">Create your first class</button>
            </div>
        `;
  }

  return classes
    .map(
      (c) => `
        <div class="list-item">
            <div class="list-item-icon">
                <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(c.name)}</div>
                <div class="list-item-subtitle">${escapeHtml(c.quarter)} • ${escapeHtml(c.role)}</div>
            </div>
            <div style="margin-left: auto;">
                <a href="/classes/${c.id}" class="btn-icon"><i class="fa-solid fa-chevron-right"></i></a>
            </div>
        </div>
    `,
    )
    .join("");
}

/**
 * Render the dashboard-level Create Class modal.
 *
 * @returns {string} HTML string
 */
export function createCreateClassModal(upcomingQuarters = []) {
  const options = upcomingQuarters.length
    ? upcomingQuarters
        .map((q) => `<option value="${q.code}">${q.full}</option>`)
        .join("")
    : `
        <option value="FA25">Fall 2025</option>
        <option value="WI26">Winter 2026</option>
        <option value="SP26">Spring 2026</option>
    `;

  return `
    <div id="modal-create-class" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h3 class="modal-title">Create New Class</h3>
                <button class="btn-close" onclick="closeModal('modal-create-class')"><i class="fa-solid fa-times"></i></button>
            </div>
            <form 
                hx-post="/classes/create" 
                hx-target="#modal-create-class-content" 
                hx-swap="innerHTML"
            >
                <section id="modal-create-class-content">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Class Name</label>
                            <input type="text" name="name" class="form-input" placeholder="e.g. CSE 210: Software Engineering" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Quarter</label>
                            <select name="quarter" class="form-select">
                                ${options}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Location</label>
                            <select name="location" class="form-select">
                                <option value="In Person">In Person</option>
                                <option value="Online">Online</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn--secondary" onclick="closeModal('modal-create-class')">Cancel</button>
                        <button type="submit" class="btn btn--primary">Create Class</button>
                    </div>
                </section>
            </form>
        </div>
    </div>
    `;
}

/**
 * Render the Work Journal (Quick Journal) modal.
 *
 * @returns {string} HTML string
 */
export function createQuickJournalModal() {
  return `
    <div id="modal-quick-journal" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h3 class="modal-title">Work Journal Entry</h3>
                <button class="btn-close" onclick="closeModal('modal-quick-journal')"><i class="fa-solid fa-times"></i></button>
            </div>
            <form onsubmit="event.preventDefault(); closeModal('modal-quick-journal'); showToast('Saved', 'Journal entry saved.', 'success');">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">What did you work on?</label>
                        <textarea class="form-input" rows="4" placeholder="I implemented the new dashboard UI..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mood</label>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn--secondary" style="flex:1">😊</button>
                            <button type="button" class="btn btn--secondary" style="flex:1">😐</button>
                            <button type="button" class="btn btn--secondary" style="flex:1">😫</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn--secondary" onclick="closeModal('modal-quick-journal')">Cancel</button>
                    <button type="submit" class="btn btn--primary">Save Entry</button>
                </div>
            </form>
        </div>
    </div>
    `;
}
