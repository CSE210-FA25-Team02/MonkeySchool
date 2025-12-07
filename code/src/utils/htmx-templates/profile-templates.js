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
 * @returns {string} HTML string
 */
export function renderProfilePage(user, activity = []) {
  // Defaults for display
  const displayName = user?.name || "Student";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const email = user?.email || "student@ucsd.edu";
  const pronouns = user?.pronouns || "";
  const bio = user?.bio || "No bio yet.";
  const github = user?.github || "";
  const linkedin = user?.linkedin || "";

  return `
  <div id="profile-page-root">
    <div class="container" style="max-width: 1000px;">
      <!-- Profile Header Card -->
      <div class="profile-header-card">
        <div class="profile-avatar-xl">
          ${initials}
        </div>
        <div class="profile-info">
          <div class="profile-name-row">
            <div class="profile-name">${escapeHtml(displayName)}</div>
            ${pronouns ? `<div class="profile-pronouns">${escapeHtml(pronouns)}</div>` : ""}
          </div>
          <div class="profile-bio">
            ${escapeHtml(bio)}
          </div>
          <div class="profile-socials">
            ${github ? `<a href="https://github.com/${escapeHtml(github)}" class="social-link" target="_blank"><i class="fa-brands fa-github"></i> ${escapeHtml(github)}</a>` : ""}
            ${linkedin ? `<a href="https://linkedin.com/in/${escapeHtml(linkedin)}" class="social-link" target="_blank"><i class="fa-brands fa-linkedin"></i> ${escapeHtml(linkedin)}</a>` : ""}
            <a href="mailto:${escapeHtml(email)}" class="social-link"><i class="fa-regular fa-envelope"></i> ${escapeHtml(email)}</a>
          </div>
        </div>
        <button 
          onclick="openModal('modal-edit-profile')"
          style="position: absolute; top: 24px; right: 24px; border: 1px solid var(--color-border-subtle); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; color: var(--color-text-muted); z-index: 10; cursor: pointer; background: white;">
          <i class="fa-solid fa-pencil"></i> Edit
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6);">
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

        <!-- Right Col: Settings Form -->
        <div class="activity-section">
          <div class="activity-header">
            <i class="fa-solid fa-gear"></i> Settings
          </div>
          <form 
            hx-post="/users/settings"
            hx-swap="none"
            onsubmit="event.preventDefault(); showToast('Success', 'Preferences saved.', 'success');"
          >
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 8px;">Timezone</label>
              <select name="timezone" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 8px;">Email Notifications</label>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <input type="checkbox" name="notify_announcements" checked> Class Announcements
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 4px;">
                <input type="checkbox" name="notify_messages" checked> Group Messages
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 8px;">Accessibility</label>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <input type="checkbox" name="high_contrast"> High Contrast Mode
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 4px;">
                <input type="checkbox" name="reduce_motion"> Reduce Motion
              </div>
            </div>
            <button type="submit" style="width: 100%; background: var(--color-brand-deep); color: white; padding: 8px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer;">
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    ${renderEditProfileModal(user)}
    </div>
  `;
}

/**
 * Render activity timeline on the profile page.
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
        startTime.getDate()
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

  return items
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
    `
    )
    .join("");
}

/**
 * Render Edit Profile modal for the current user.
 *
 * @param {Object} user - User object
 * @returns {string} HTML string
 */
function renderEditProfileModal(user) {
  const displayName = user?.name || "";
  const pronouns = user?.pronouns || "";
  const bio = user?.bio || "";
  const github = user?.github || "";

  return `
    <div id="modal-edit-profile" class="modal-overlay">
      <div class="modal-card">
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
              <label class="form-label">Display Name</label>
              <input type="text" class="form-input" name="name" value="${escapeHtml(displayName)}">
            </div>
            <div class="form-group">
              <label class="form-label">Pronouns</label>
              <input type="text" class="form-input" name="pronouns" value="${escapeHtml(pronouns)}" placeholder="e.g. she/her, he/him, they/them">
            </div>
            <div class="form-group">
              <label class="form-label">Bio</label>
              <textarea class="form-input" name="bio" rows="3" style="resize: none;">${escapeHtml(bio)}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Github Username</label>
              <input type="text" class="form-input" name="github" value="${escapeHtml(github)}" placeholder="e.g. zihanzhou">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-edit-profile')">Cancel</button>
            <button type="submit" class="btn btn--primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
