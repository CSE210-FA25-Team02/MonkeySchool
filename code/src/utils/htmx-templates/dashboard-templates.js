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
                <h2>Welcome back, ${displayName}</h2>
                <p>Ready to monkey around with some code?</p>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="bento-card span-1">
            <div class="card-header">
                <div class="card-title"><i class="fa-solid fa-bolt"></i> Actions</div>
            </div>
            <div class="card-content card-content--actions">
                ${
                  user.isProf
                    ? `
                <button 
                    class="btn btn-primary btn--full btn--center" 
                    onclick="openModal('modal-create-class')"
                >
                    <i class="fa-solid fa-plus"></i> Create Class
                </button>
                `
                    : `
                <button 
                    class="btn btn-primary btn--full btn--center" 
                    onclick="openModal('modal-join-class')"
                >
                    <i class="fa-solid fa-user-plus"></i> Join Class
                </button>
                `
                }
                <button 
                    class="btn btn-secondary btn--full btn--center" 
                    onclick="openModal('modal-quick-journal')"
                >
                    <i class="fa-solid fa-pen-to-square"></i> Work Journal
                </button>
            </div>
        </div>

        <!-- Activity Punch-In Card -->
        <div class="bento-card span-1" id="activity-punch-card-container">
            <div class="card-content">
                <div class="activity-punch-inner">
                    <div class="activity-punch-icon"><i class="fa-solid fa-fingerprint"></i></div>
                    <div class="activity-punch-label">Punch In Activity</div>
                    <button 
                        class="btn btn-primary btn--full activity-punch-button btn--center"
                        hx-get="/activity/new-modal" 
                        hx-target="#modal-container"
                        hx-swap="innerHTML"
                    >
                        <i class="fa-solid fa-plus"></i> New Activity
                    </button>
                </div>
            </div>
        </div>

        <!-- Recent Classes -->
        <div class="bento-card span-2 row-span-2">
            <div class="card-header">
                <div class="card-title"><i class="fa-solid fa-book-open"></i> My Classes</div>
                <a href="/classes" class="card-action">View All</a>
            </div>
            <div class="card-content">
                ${renderRecentClassesList(recentClasses, user)}
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
    ${user.isProf ? createCreateClassModal(getUpcomingQuarters()) : ""}
    
    <!-- Join Class Modal (Hidden by default) -->
    ${!user.isProf ? createJoinClassModal() : ""}
    
    <!-- Quick Journal Modal -->
    ${createQuickJournalModal()}
    
    <!-- Modal Container for Activity Modals -->
    <div id="modal-container"></div>
    
    <script>
      // Handle activity modal display - ensure it opens when loaded
      document.body.addEventListener('htmx:afterSwap', function(event) {
        if (event.target.id === 'modal-container') {
          const modal = document.getElementById('activity-modal');
          if (modal) {
            modal.classList.add('open');
          }
        }
        // Ensure modal stays open after any swap inside it
        if (event.target && event.target.closest && event.target.closest('#activity-modal')) {
          const modal = document.getElementById('activity-modal');
          if (modal && !modal.classList.contains('open')) {
            modal.classList.add('open');
          }
        }
      });
      
      // Close modal when clicking outside (delegated event listener)
      document.addEventListener('click', function(e) {
        const modal = document.getElementById('activity-modal');
        if (modal && e.target === modal && modal.classList.contains('open')) {
          closeModal('activity-modal');
          const container = document.getElementById('modal-container');
          if (container) {
            container.innerHTML = '';
          }
        }
      });
    </script>
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
    return `<div class="empty-state">No upcoming events</div>`;
  }

  const iconMap = {
    lecture: {
      icon: "fa-book-open",
      class: "list-item-icon--lecture",
    },
    meeting: {
      icon: "fa-user-group",
      class: "list-item-icon--meeting",
    },
    "office-hours": {
      icon: "fa-clock",
      class: "list-item-icon--office-hours",
    },
    default: {
      icon: "fa-calendar",
      class: "list-item-icon--default",
    },
  };

  return events
    .map((e) => {
      const style = iconMap[e.type] || iconMap.default;
      return `
            <div class="list-item">
                <div class="list-item-icon ${style.class}">
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
 * @param {Object} user - User object with isProf property
 * @returns {string} HTML string
 */
function renderRecentClassesList(classes, user = null) {
  if (!classes || classes.length === 0) {
    const modalId = user?.isProf ? "modal-create-class" : "modal-join-class";
    const buttonText = user?.isProf
      ? "Create your first class"
      : "Join a class";
    return `
            <div class="empty-state empty-state--large">
                <p>No classes yet.</p>
                <button class="btn btn-secondary empty-state-button" onclick="openModal('${modalId}')">${buttonText}</button>
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
            <div class="list-item-action">
                <a href="/classes/${c.id}" class="btn-icon"><i class="fa-solid fa-chevron-right"></i></a>
            </div>
        </div>
    `
    )
    .join("");
}

/**
 * Render the dashboard-level Create Class modal.
 *
 * @param {Array} [upcomingQuarters=[]] - List of upcoming quarters
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
                        <button type="button" class="btn btn-secondary" onclick="closeModal('modal-create-class')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Class</button>
                    </div>
                </section>
            </form>
        </div>
    </div>
    `;
}

/**
 * Render the Join Class modal.
 *
 * @returns {string} HTML string
 */
export function createJoinClassModal() {
  return `
    <div id="modal-join-class" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h3 class="modal-title">Join Class</h3>
                <button class="btn-close" onclick="closeModal('modal-join-class')"><i class="fa-solid fa-times"></i></button>
            </div>
            <form 
                hx-post="/classes/join" 
                hx-target="#modal-join-class-content" 
                hx-swap="innerHTML"
            >
                <section id="modal-join-class-content">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Invite Code</label>
                            <input 
                                type="text" 
                                name="inviteCode" 
                                class="form-input" 
                                placeholder="Enter the class invite code"
                                required
                                autocomplete="off"
                            >
                            <p class="form-helper">Ask your instructor for the invite code to join their class.</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('modal-join-class')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Join Class</button>
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
            <form 
              hx-post="/work-journals"
              hx-target="body"
              hx-swap="none"
              hx-on::after-request="if(event.detail.successful) { closeModal('modal-quick-journal'); if(typeof showToast !== 'undefined') showToast('Saved', 'Journal entry saved successfully!', 'success'); const contentField = document.getElementById('quick-journal-content'); if(contentField) contentField.value = ''; const quickMoodInput = document.getElementById('quick-journal-mood'); if(quickMoodInput) quickMoodInput.value = ''; const quickModal = document.getElementById('modal-quick-journal'); if(quickModal) { quickModal.querySelectorAll('.mood-btn').forEach(btn => { btn.classList.remove('btn-primary'); btn.classList.add('btn-secondary'); }); } }"
              onsubmit="event.preventDefault(); if(typeof htmx !== 'undefined') { htmx.trigger(this, 'submit'); } else { alert('HTMX not loaded'); }"
            >
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">What did you work on?</label>
                        <textarea 
                          id="quick-journal-content"
                          name="content" 
                          class="form-input" 
                          rows="4" 
                          placeholder="I implemented the new dashboard UI..."
                          required
                        ></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mood</label>
                        <div class="mood-buttons">
                            <button 
                              type="button" 
                              class="btn btn-secondary mood-btn" 
                              data-mood="😊"
                              onclick="selectMoodQuick('😊', this)"
                            >😊</button>
                            <button 
                              type="button" 
                              class="btn btn-secondary mood-btn" 
                              data-mood="😐"
                              onclick="selectMoodQuick('😐', this)"
                            >😐</button>
                            <button 
                              type="button" 
                              class="btn btn-secondary mood-btn" 
                              data-mood="😫"
                              onclick="selectMoodQuick('😫', this)"
                            >😫</button>
                        </div>
                        <input type="hidden" id="quick-journal-mood" name="mood" value="">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('modal-quick-journal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Entry</button>
                </div>
            </form>
        </div>
    </div>
    <script>
      // Make selectMoodQuick available globally for dashboard modal
      window.selectMoodQuick = function(mood, buttonElement) {
        const moodInput = document.getElementById('quick-journal-mood');
        if (!moodInput) {
          console.warn('quick-journal-mood input not found');
          return;
        }
        
        moodInput.value = mood;
        // Reset all mood buttons in the modal
        const modal = document.getElementById('modal-quick-journal');
        if (modal) {
          modal.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
          });
        }
        // Highlight selected button
        if (buttonElement) {
          buttonElement.classList.remove('btn-secondary');
          buttonElement.classList.add('btn-primary');
        }
      };
      
      // Reset mood selection when dashboard modal opens
      (function() {
        const modal = document.getElementById('modal-quick-journal');
        if (modal) {
          const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (modal.classList.contains('open')) {
                  const moodInput = document.getElementById('quick-journal-mood');
                  if (moodInput) {
                    moodInput.value = '';
                  }
                  modal.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                  });
                }
              }
            });
          });
          observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        }
      })();
    </script>
    `;
}
