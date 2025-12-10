/**
 * HTMX Templates for Profile Page
 * code/src/utils/htmx-templates/profile-templates.js
 *
 * Based on demo/profile.html
 * Per NOTES: Remove Attendance, punches, badges section
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Render the user profile page
 * @param {Object} user - User object
 * @param {Array} activity - Activity history array (optional, for future backend integration)
 * @param {Array} workJournals - Work journal entries array
 * @returns {string} HTML string
 */
export function renderProfilePage(user, activity = [], workJournals = []) {
  // Defaults for display
  const displayName = user?.name || "Student";
  const preferredName = user?.preferredName || "";
  const pronunciation = user?.pronunciation || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const email = user?.email || "student@ucsd.edu";
  const pronouns = user?.pronouns || "";
  const phone = user?.phone || "";
  const bio = user?.bio || "No bio yet.";
  const github = user?.github || "";
  const photoUrl = user?.photoUrl || null;
  const socialLinks = user?.socialLinks || [];
  const chatLinks = user?.chatLinks || [];
  const timezone = user?.timezone || "";

  // Render avatar - use photo if available, otherwise show initials
  const avatarContent = photoUrl
    ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : initials;

  // Render social links from array
  const socialLinksHtml = socialLinks
    .map((link) => {
      const url = link.startsWith("http") ? link : `https://${link}`;
      return `<a href="${escapeHtml(url)}" class="social-link" target="_blank"><i class="fa-solid fa-link"></i> ${escapeHtml(link)}</a>`;
    })
    .join("");

  // Render chat links from array
  const chatLinksHtml = chatLinks
    .map((link) => {
      return `<a href="${escapeHtml(link)}" class="social-link" target="_blank"><i class="fa-solid fa-comment"></i> ${escapeHtml(link)}</a>`;
    })
    .join("");

  return `
  <div id="profile-page-root">
    <div class="container" style="max-width: 1000px;">
      <!-- Profile Header Card -->
      <div class="profile-header-card">
        <div class="profile-avatar-xl">
          ${avatarContent}
        </div>
        <div class="profile-info">
          <div class="profile-name-row">
            <div class="profile-name">${escapeHtml(displayName)}${preferredName && preferredName !== displayName ? ` (${escapeHtml(preferredName)})` : ""}</div>
            ${pronouns ? `<div class="profile-pronouns">${escapeHtml(pronouns)}</div>` : ""}
          </div>
          ${pronunciation ? `<div class="profile-pronunciation" style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-2);"><i class="fa-solid fa-volume-high"></i> ${escapeHtml(pronunciation)}</div>` : ""}
          <div class="profile-bio">
            ${escapeHtml(bio)}
          </div>
          <div class="profile-contact-info" style="display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-3);">
            <a href="mailto:${escapeHtml(email)}" class="social-link"><i class="fa-regular fa-envelope"></i> ${escapeHtml(email)}</a>
            ${phone ? `<a href="tel:${escapeHtml(phone)}" class="social-link"><i class="fa-solid fa-phone"></i> ${escapeHtml(phone)}</a>` : ""}
            ${timezone ? `<span class="social-link" style="cursor: default;"><i class="fa-solid fa-clock"></i> ${escapeHtml(timezone)}</span>` : ""}
          </div>
          <div class="profile-socials">
            ${github ? `<a href="https://github.com/${escapeHtml(github)}" class="social-link" target="_blank"><i class="fa-brands fa-github"></i> ${escapeHtml(github)}</a>` : ""}
            ${socialLinksHtml}
            ${chatLinksHtml}
          </div>
        </div>
        <button 
          class="profile-edit-btn"
          onclick="openModal('modal-edit-profile')">
          <i class="fa-solid fa-pencil"></i> Edit
        </button>
      </div>

      <div class="profile-content-grid">
        <!-- Left Col: Activity Stream -->
        <div>
          <div class="activity-section">
            <div class="activity-header">
              <i class="fa-solid fa-clock-rotate-left"></i> Activity History
            </div>
            <div class="timeline">
              ${renderActivityTimeline(activity)}
            </div>
          </div>
        </div>

        <!-- Right Col: Work Journals -->
        <div class="activity-section">
          <div class="activity-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <i class="fa-solid fa-pen-to-square"></i> Work Journals
            </div>
            <button 
              class="btn btn-primary" 
              style="padding: 6px 12px; font-size: 12px;"
              onclick="openModal('modal-create-journal')"
            >
              <i class="fa-solid fa-plus"></i> New Entry
            </button>
          </div>
          <div id="work-journals-list">
            ${renderWorkJournalsList(workJournals)}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    ${renderEditProfileModal(user)}
    
    <!-- Create Work Journal Modal -->
    ${renderCreateJournalModal()}
    
    <!-- Activity History Modal -->
    ${renderActivityHistoryModal(activity)}
    
    <!-- Work Journals Modal -->
    ${renderWorkJournalsModal(workJournals)}
    </div>
  `;
}

/**
 * Render activity timeline on the profile page.
 * Shows only first 3 items with a "View More" button if there are more.
 *
 * @param {Array} activity - List of activity items from database
 * @returns {string} HTML string
 */
function renderActivityTimeline(activity) {
  // Format database activities into timeline items
  let items = [];

  if (activity && activity.length > 0) {
    items = activity.map((act) => {
      const startTime = new Date(act.startTime);
      const endTime = act.endTime ? new Date(act.endTime) : null;
      const className = act.class?.name || "Unknown Class";
      const categoryName = act.category?.name || "Activity";

      // Format time display
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activityDate = new Date(
        startTime.getFullYear(),
        startTime.getMonth(),
        startTime.getDate(),
      );

      let timeDisplay = "";
      if (activityDate.getTime() === today.getTime()) {
        timeDisplay = `Today, ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      } else if (activityDate.getTime() === today.getTime() - 86400000) {
        timeDisplay = `Yesterday, ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      } else {
        const daysDiff = Math.floor((today - activityDate) / 86400000);
        if (daysDiff < 7) {
          timeDisplay = `${daysDiff} days ago, ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
        } else {
          timeDisplay =
            startTime.toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year:
                startTime.getFullYear() !== now.getFullYear()
                  ? "numeric"
                  : undefined,
            }) +
            ", " +
            startTime.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });
        }
      }

      // Determine if it's a punch in or punch out
      const isPunchOut = endTime !== null;
      const title = isPunchOut
        ? `Punched out from <strong>${escapeHtml(className)}</strong> - ${escapeHtml(categoryName)}`
        : `Punched in for <strong>${escapeHtml(className)}</strong> - ${escapeHtml(categoryName)}`;

      return {
        type: "punch",
        title: title,
        time: timeDisplay,
      };
    });
  }

  // If no activities, show empty state
  if (items.length === 0) {
    return `
      <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">
        <p>No activity history yet.</p>
        <p style="font-size: 12px; margin-top: 8px;">Start by punching in an activity from the dashboard!</p>
      </div>
    `;
  }

  const iconMap = {
    punch: "fa-fingerprint",
    post: "fa-comment",
    join: "fa-user-plus",
    default: "fa-circle",
  };

  // Show only first 3 items
  const displayItems = items.slice(0, 3);
  const hasMore = items.length > 3;

  let html = displayItems
    .map(
      (item) => `
      <div class="timeline-item">
        <div class="timeline-dot ${item.type}">
          <i class="fa-solid ${iconMap[item.type] || iconMap.default}"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-title">${item.title}</div>
          <div class="timeline-meta">${escapeHtml(item.time)}</div>
        </div>
      </div>
    `,
    )
    .join("");

  // Add "View More" button if there are more than 3 items
  if (hasMore) {
    html += `
      <div style="text-align: center; padding: 16px;">
        <button 
          class="btn btn-secondary" 
          style="padding: 8px 16px; font-size: 12px;"
          onclick="openModal('modal-activity-history')"
        >
          View More (${items.length - 3} more)
        </button>
      </div>
    `;
  }

  return html;
}

/**
 * Render work journals list
 * Shows only first 3 items with a "View More" button if there are more.
 *
 * @param {Array} workJournals - List of work journal entries
 * @returns {string} HTML string
 */
export function renderWorkJournalsList(workJournals) {
  if (!workJournals || workJournals.length === 0) {
    return `
      <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">
        <p>No work journals yet.</p>
        <p style="font-size: 12px; margin-top: 8px;">Click "New Entry" to create your first journal entry!</p>
      </div>
    `;
  }

  // Show only first 3 items
  const displayJournals = workJournals.slice(0, 3);
  const hasMore = workJournals.length > 3;

  let html = displayJournals
    .map((journal) => {
      const createdAt = new Date(journal.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const journalDate = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate(),
      );

      let timeDisplay = "";
      if (journalDate.getTime() === today.getTime()) {
        timeDisplay = `Today, ${createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      } else if (journalDate.getTime() === today.getTime() - 86400000) {
        timeDisplay = `Yesterday, ${createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      } else {
        const daysDiff = Math.floor((today - journalDate) / 86400000);
        if (daysDiff < 7) {
          timeDisplay = `${daysDiff} days ago`;
        } else {
          timeDisplay = createdAt.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year:
              createdAt.getFullYear() !== now.getFullYear()
                ? "numeric"
                : undefined,
          });
        }
      }

      const moodEmoji = journal.mood || "";
      const contentPreview =
        journal.content.length > 100
          ? journal.content.substring(0, 100) + "..."
          : journal.content;

      return `
        <div class="work-journal-item" style="padding: 12px; border-bottom: 1px solid var(--color-border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${moodEmoji ? `<span style="font-size: 18px;">${escapeHtml(moodEmoji)}</span>` : ""}
              <span style="font-size: 11px; color: var(--color-text-muted);">${escapeHtml(timeDisplay)}</span>
            </div>
            <button 
              class="btn btn-secondary" 
              style="padding: 4px 8px; font-size: 11px;"
              onclick="deleteJournal('${journal.id}')"
              title="Delete journal"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: var(--color-text);">
            ${escapeHtml(contentPreview)}
          </div>
        </div>
      `;
    })
    .join("");

  // Add "View More" button if there are more than 3 items
  if (hasMore) {
    html += `
      <div style="text-align: center; padding: 16px;">
        <button 
          class="btn btn-secondary" 
          style="padding: 8px 16px; font-size: 12px;"
          onclick="openModal('modal-work-journals')"
        >
          View More (${workJournals.length - 3} more)
        </button>
      </div>
    `;
  }

  return html;
}

/**
 * Render Create Work Journal modal
 *
 * @returns {string} HTML string
 */
function renderCreateJournalModal() {
  return `
    <div id="modal-create-journal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Work Journal Entry</h3>
          <button class="btn-close" onclick="closeModal('modal-create-journal')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-post="/work-journals"
          hx-target="#work-journals-list"
          hx-swap="innerHTML"
          hx-on::after-request="if(event.detail.successful) { closeModal('modal-create-journal'); const contentField = document.getElementById('journal-content'); if(contentField) contentField.value = ''; const moodInput = document.getElementById('journal-mood'); if(moodInput) moodInput.value = ''; const modal = document.getElementById('modal-create-journal'); if(modal) { modal.querySelectorAll('.mood-btn').forEach(btn => { btn.classList.remove('btn-primary'); btn.classList.add('btn-secondary'); }); } }"
          onsubmit="event.preventDefault(); htmx.trigger(this, 'submit');"
        >
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">What did you work on?</label>
              <textarea 
                id="journal-content"
                name="content" 
                class="form-input" 
                rows="4" 
                placeholder="I implemented the new dashboard UI..."
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Mood</label>
              <div style="display: flex; gap: 8px;">
                <button 
                  type="button" 
                  class="btn btn-secondary mood-btn" 
                  data-mood="😊"
                  style="flex:1"
                  onclick="selectMood('😊', this)"
                >😊</button>
                <button 
                  type="button" 
                  class="btn btn-secondary mood-btn" 
                  data-mood="😐"
                  style="flex:1"
                  onclick="selectMood('😐', this)"
                >😐</button>
                <button 
                  type="button" 
                  class="btn btn-secondary mood-btn" 
                  data-mood="😫"
                  style="flex:1"
                  onclick="selectMood('😫', this)"
                >😫</button>
              </div>
              <input type="hidden" id="journal-mood" name="mood" value="">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('modal-create-journal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Entry</button>
          </div>
        </form>
      </div>
    </div>
    <script>
      // Make selectMood available globally - ensure it's always defined
      window.selectMood = function(mood, buttonElement) {
        const moodInput = document.getElementById('journal-mood');
        if (!moodInput) {
          console.warn('journal-mood input not found');
          return;
        }
        
        moodInput.value = mood;
        // Reset all mood buttons in the modal
        const modal = document.getElementById('modal-create-journal');
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
      
      // Make deleteJournal available globally
      window.deleteJournal = function(journalId) {
        if (!confirm('Are you sure you want to delete this journal entry?')) {
          return;
        }
        if (typeof htmx !== 'undefined') {
          htmx.ajax('DELETE', '/work-journals/' + journalId, {
            target: '#work-journals-list',
            swap: 'innerHTML',
            headers: { 'HX-Request': 'true' }
          });
        }
      };
      
      // Reset mood selection when modal opens
      (function() {
        const modal = document.getElementById('modal-create-journal');
        if (modal) {
          // Use MutationObserver to detect when modal opens
          const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (modal.classList.contains('open')) {
                  // Reset mood selection
                  const moodInput = document.getElementById('journal-mood');
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

/**
 * Render Activity History modal with all activities in a scrollable list
 *
 * @param {Array} activity - List of activity items from database
 * @returns {string} HTML string
 */
function renderActivityHistoryModal(activity) {
  // Format database activities into timeline items
  let items = [];

  if (activity && activity.length > 0) {
    items = activity.map((act) => {
      const startTime = new Date(act.startTime);
      const endTime = act.endTime ? new Date(act.endTime) : null;
      const className = act.class?.name || "Unknown Class";
      const categoryName = act.category?.name || "Activity";

      // Format time display
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activityDate = new Date(
        startTime.getFullYear(),
        startTime.getMonth(),
        startTime.getDate(),
      );

      let timeDisplay = "";
      if (activityDate.getTime() === today.getTime()) {
        timeDisplay = `Today, ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      } else if (activityDate.getTime() === today.getTime() - 86400000) {
        timeDisplay = `Yesterday, ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      } else {
        const daysDiff = Math.floor((today - activityDate) / 86400000);
        if (daysDiff < 7) {
          timeDisplay = `${daysDiff} days ago, ${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
        } else {
          timeDisplay =
            startTime.toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year:
                startTime.getFullYear() !== now.getFullYear()
                  ? "numeric"
                  : undefined,
            }) +
            ", " +
            startTime.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });
        }
      }

      // Determine if it's a punch in or punch out
      const isPunchOut = endTime !== null;
      const title = isPunchOut
        ? `Punched out from <strong>${escapeHtml(className)}</strong> - ${escapeHtml(categoryName)}`
        : `Punched in for <strong>${escapeHtml(className)}</strong> - ${escapeHtml(categoryName)}`;

      return {
        type: "punch",
        title: title,
        time: timeDisplay,
      };
    });
  }

  const iconMap = {
    punch: "fa-fingerprint",
    post: "fa-comment",
    join: "fa-user-plus",
    default: "fa-circle",
  };

  const timelineItems =
    items.length > 0
      ? items
          .map(
            (item) => `
          <div class="timeline-item">
            <div class="timeline-dot ${item.type}">
              <i class="fa-solid ${iconMap[item.type] || iconMap.default}"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">${item.title}</div>
              <div class="timeline-meta">${escapeHtml(item.time)}</div>
            </div>
          </div>
        `,
          )
          .join("")
      : `
      <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">
        <p>No activity history yet.</p>
        <p style="font-size: 12px; margin-top: 8px;">Start by punching in an activity from the dashboard!</p>
      </div>
    `;

  return `
    <div id="modal-activity-history" class="modal-overlay">
      <div class="modal-card" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Activity History</h3>
          <button class="btn-close" onclick="closeModal('modal-activity-history')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: var(--space-6);">
          <div class="timeline">
            ${timelineItems}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('modal-activity-history')">Close</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Work Journals modal with all journals in a scrollable list
 *
 * @param {Array} workJournals - List of work journal entries
 * @returns {string} HTML string
 */
function renderWorkJournalsModal(workJournals) {
  const journalItems =
    workJournals && workJournals.length > 0
      ? workJournals
          .map((journal) => {
            const createdAt = new Date(journal.createdAt);
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const journalDate = new Date(
              createdAt.getFullYear(),
              createdAt.getMonth(),
              createdAt.getDate(),
            );

            let timeDisplay = "";
            if (journalDate.getTime() === today.getTime()) {
              timeDisplay = `Today, ${createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
            } else if (journalDate.getTime() === today.getTime() - 86400000) {
              timeDisplay = `Yesterday, ${createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
            } else {
              const daysDiff = Math.floor((today - journalDate) / 86400000);
              if (daysDiff < 7) {
                timeDisplay = `${daysDiff} days ago`;
              } else {
                timeDisplay = createdAt.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year:
                    createdAt.getFullYear() !== now.getFullYear()
                      ? "numeric"
                      : undefined,
                });
              }
            }

            const moodEmoji = journal.mood || "";
            const contentPreview =
              journal.content.length > 100
                ? journal.content.substring(0, 100) + "..."
                : journal.content;

            return `
            <div class="work-journal-item" style="padding: 12px; border-bottom: 1px solid var(--color-border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${moodEmoji ? `<span style="font-size: 18px;">${escapeHtml(moodEmoji)}</span>` : ""}
                  <span style="font-size: 11px; color: var(--color-text-muted);">${escapeHtml(timeDisplay)}</span>
                </div>
                <button 
                  class="btn btn-secondary" 
                  style="padding: 4px 8px; font-size: 11px;"
                  onclick="deleteJournal('${journal.id}')"
                  title="Delete journal"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
              <div style="font-size: 13px; line-height: 1.5; color: var(--color-text);">
                ${escapeHtml(contentPreview)}
              </div>
            </div>
          `;
          })
          .join("")
      : `
      <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">
        <p>No work journals yet.</p>
        <p style="font-size: 12px; margin-top: 8px;">Click "New Entry" to create your first journal entry!</p>
      </div>
    `;

  return `
    <div id="modal-work-journals" class="modal-overlay">
      <div class="modal-card" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Work Journals</h3>
          <button class="btn-close" onclick="closeModal('modal-work-journals')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: var(--space-6);">
          ${journalItems}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('modal-work-journals')">Close</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Edit Profile modal for the current user.
 *
 * @param {Object} user - User object
 * @returns {string} HTML string
 */
function renderEditProfileModal(user) {
  const displayName = user?.name || "";
  const preferredName = user?.preferredName || "";
  const pronunciation = user?.pronunciation || "";
  const pronouns = user?.pronouns || "";
  const phone = user?.phone || "";
  const bio = user?.bio || "";
  const github = user?.github || "";
  const photoUrl = user?.photoUrl || "";
  const socialLinks = user?.socialLinks || [];
  const chatLinks = user?.chatLinks || [];
  const timezone = user?.timezone || "";

  // Render social links inputs
  const socialLinksInputs =
    socialLinks.length > 0
      ? socialLinks
          .map(
            (link) => `
        <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
          <input type="text" class="form-input" name="socialLinks[]" value="${escapeHtml(link)}" placeholder="https://example.com/...">
          <button type="button" class="btn btn-secondary" onclick="removeLinkField(this)" style="padding: 6px 12px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `,
          )
          .join("")
      : "";

  // Render chat links inputs
  const chatLinksInputs =
    chatLinks.length > 0
      ? chatLinks
          .map(
            (link) => `
        <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
          <input type="text" class="form-input" name="chatLinks[]" value="${escapeHtml(link)}" placeholder="Chat handle or URL">
          <button type="button" class="btn btn-secondary" onclick="removeLinkField(this)" style="padding: 6px 12px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `,
          )
          .join("")
      : "";

  return `
    <div id="modal-edit-profile" class="modal-overlay">
      <div class="modal-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Profile</h3>
          <button class="btn-close" onclick="closeModal('modal-edit-profile')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-put="/users/profile"
          hx-target="#profile-page-root"
          hx-swap="innerHTML"
          onsubmit="closeModal('modal-edit-profile')"
        >
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Display Name *</label>
              <input type="text" class="form-input" name="name" value="${escapeHtml(displayName)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Preferred Name</label>
              <input type="text" class="form-input" name="preferredName" value="${escapeHtml(preferredName)}" placeholder="Name you prefer to be called">
            </div>
            <div class="form-group">
              <label class="form-label">Pronunciation</label>
              <input type="text" class="form-input" name="pronunciation" value="${escapeHtml(pronunciation)}" placeholder="e.g. John (JON)">
            </div>
            <div class="form-group">
              <label class="form-label">Pronouns</label>
              <input type="text" class="form-input" name="pronouns" value="${escapeHtml(pronouns)}" placeholder="e.g. she/her, he/him, they/them">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" name="phone" value="${escapeHtml(phone)}" placeholder="e.g. +1-555-123-4567">
            </div>
            <div class="form-group">
              <label class="form-label">Photo URL</label>
              <input type="url" class="form-input" name="photoUrl" value="${escapeHtml(photoUrl)}" placeholder="https://example.com/photo.jpg">
            </div>
            <div class="form-group">
              <label class="form-label">Bio</label>
              <textarea class="form-input" name="bio" rows="3" style="resize: none;" placeholder="Tell us about yourself...">${escapeHtml(bio)}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Github Username</label>
              <input type="text" class="form-input" name="github" value="${escapeHtml(github)}" placeholder="e.g. zihanzhou">
            </div>
            <div class="form-group">
              <label class="form-label">Timezone</label>
              <input type="text" class="form-input" name="timezone" value="${escapeHtml(timezone)}" placeholder="e.g. America/Los_Angeles, PST, UTC-8">
            </div>
            <div class="form-group">
              <label class="form-label">Social Links</label>
              <div id="social-links-container">
                ${socialLinksInputs}
                <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" class="form-input" name="socialLinks[]" placeholder="https://example.com/...">
                  <button type="button" class="btn btn-secondary" onclick="removeLinkField(this)" style="padding: 6px 12px;">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-secondary" onclick="addLinkField('social-links-container', 'socialLinks[]')" style="margin-top: 8px; padding: 6px 12px; font-size: 12px;">
                <i class="fa-solid fa-plus"></i> Add Social Link
              </button>
            </div>
            <div class="form-group">
              <label class="form-label">Chat Links</label>
              <div id="chat-links-container">
                ${chatLinksInputs}
                <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" class="form-input" name="chatLinks[]" placeholder="Chat handle or URL">
                  <button type="button" class="btn btn-secondary" onclick="removeLinkField(this)" style="padding: 6px 12px;">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-secondary" onclick="addLinkField('chat-links-container', 'chatLinks[]')" style="margin-top: 8px; padding: 6px 12px; font-size: 12px;">
                <i class="fa-solid fa-plus"></i> Add Chat Link
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('modal-edit-profile')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
    <script>
      // Make addLinkField and removeLinkField available globally
      window.addLinkField = function(containerId, fieldName) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const newField = document.createElement('div');
        newField.className = 'form-group';
        newField.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        newField.innerHTML = \`
          <input type="text" class="form-input" name="\${fieldName}" placeholder="\${fieldName.includes('social') ? 'https://example.com/...' : 'Chat handle or URL'}">
          <button type="button" class="btn btn-secondary" onclick="removeLinkField(this)" style="padding: 6px 12px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        \`;
        container.appendChild(newField);
      };
      
      window.removeLinkField = function(button) {
        const fieldGroup = button.closest('.form-group');
        if (fieldGroup && fieldGroup.parentElement.children.length > 1) {
          fieldGroup.remove();
        }
      };
    </script>
  `;
}
