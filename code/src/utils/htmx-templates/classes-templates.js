/**
 * HTMX Templates for Class Management
 * code/src/utils/htmx-templates/classes-templates.js
 */

import { escapeHtml, getUpcomingQuarters } from "../html-templates.js";
import { createJoinClassModal } from "./dashboard-templates.js";

/**
 * Render the Pulse Check success state (after submission)
 * @param {number} pulseValue - Pulse value (1-5)
 * @param {string} [classId=''] - Class ID for data attribute
 * @returns {string} HTML string
 */
export function renderPulseSuccess(pulseValue, classId = "") {
  const emojis = {
    1: "😞",
    2: "😐",
    3: "🙂",
    4: "😃",
    5: "🤩",
  };
  const emoji = emojis[pulseValue] || "🙂";

  return `
    <div id="pulse-check-container" class="pulse-check-widget pulse-success-state" data-class-id="${classId}">
      <div class="pulse-status">
        <div class="pulse-status-emoji" style="font-size: 32px; margin-bottom: 8px;">${emoji}</div>
        <div class="pulse-status-text" style="font-size: 12px; font-weight: bold; text-align: center; opacity: 0.95;">
          Pulse posted for today!
        </div>
        <div class="pulse-status-subtext" style="font-size: 10px; opacity: 0.8; margin-top: 4px; text-align: center;">
          You selected ${emoji} today.
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the Pulse Check UI component (for students only)
 * @param {string} classId - Class ID
 * @param {number|null} currentPulse - Current pulse value (1-5) or null if not submitted
 * @returns {string} HTML string
 */
export function renderPulseCheck(classId, currentPulse = null) {
  // If pulse already exists, show success state instead of emoji bar
  if (currentPulse !== null && currentPulse >= 1 && currentPulse <= 5) {
    return renderPulseSuccess(currentPulse, classId);
  }
  const emojis = [
    { value: 1, emoji: "😞" },
    { value: 2, emoji: "😐" },
    { value: 3, emoji: "🙂" },
    { value: 4, emoji: "😃" },
    { value: 5, emoji: "🤩" },
  ];

  const emojiButtons = emojis
    .map(
      (item) => `
      <button
        type="button"
        class="pulse-emoji-btn ${currentPulse === item.value ? "pulse-selected" : ""}"
        data-pulse-value="${item.value}"
        hx-post="/classes/${classId}/pulse"
        hx-vals='{"pulse": ${item.value}}'
        hx-target="#pulse-check-container"
        hx-swap="outerHTML"
        hx-trigger="click"
        hx-headers='{"Accept": "text/html"}'
        aria-label="Pulse ${item.value}"
        style="background: ${currentPulse === item.value ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.15)"}; border: 2px solid ${currentPulse === item.value ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.3)"}; border-radius: var(--radius-full); width: 48px; height: 48px; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(4px);"
        onmouseover="this.style.transform='scale(1.15)'; this.style.background='rgba(255, 255, 255, 0.25)'"
        onmouseout="if (!this.classList.contains('pulse-selected')) { this.style.transform='scale(1)'; this.style.background='rgba(255, 255, 255, 0.15)'; }"
        onclick="this.style.transform='scale(0.95)'"
      >
        ${item.emoji}
      </button>
    `,
    )
    .join("");

  return `
    <div id="pulse-check-container" class="pulse-check-widget" data-class-id="${classId}">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; margin-bottom: 4px;">Pulse Check</div>
      <div class="pulse-emoji-container">
        ${emojiButtons}
      </div>
    </div>
    <script>
      (function() {
        // Function to update pulse UI
        function updatePulseUI(pulseValue) {
          const container = document.getElementById('pulse-check-container');
          if (!container) return;
          
          container.querySelectorAll('.pulse-emoji-btn').forEach(btn => {
            const btnValue = parseInt(btn.getAttribute('data-pulse-value'));
            if (btnValue === pulseValue) {
              btn.classList.add('pulse-selected');
            } else {
              btn.classList.remove('pulse-selected');
            }
          });
        }

        // Fetch current pulse on page load (fallback if server didn't fetch it)
        // Note: Server-side rendering should handle this, but this is a fallback
        const classId = '${classId}';
        const container = document.getElementById('pulse-check-container');
        
        // Only fetch if we're showing the emoji bar (not success state)
        if (container && !container.classList.contains('pulse-success-state')) {
          fetch('/classes/' + classId + '/pulse', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          })
          .then(res => {
            if (res.ok) {
              return res.json();
            }
            throw new Error('Not found');
          })
          .then(data => {
            if (data && data.pulse) {
              // Replace emoji bar with success state
              const emojis = { 1: '😞', 2: '😐', 3: '🙂', 4: '😃', 5: '🤩' };
              const emoji = emojis[data.pulse] || '🙂';
              container.outerHTML = \`
                <div id="pulse-check-container" class="pulse-check-widget pulse-success-state" data-class-id="\${classId}">
                  <div class="pulse-status">
                    <div class="pulse-status-emoji" style="font-size: 32px; margin-bottom: 8px;">\${emoji}</div>
                    <div class="pulse-status-text" style="font-size: 12px; font-weight: bold; text-align: center; opacity: 0.95;">
                      Pulse posted for today!
                    </div>
                    <div class="pulse-status-subtext" style="font-size: 10px; opacity: 0.8; margin-top: 4px; text-align: center;">
                      You selected \${emoji} today.
                    </div>
                  </div>
                </div>
              \`;
            }
          })
          .catch(err => {
            // Silently fail - server-side should have handled this
            console.debug('Pulse check: using server-rendered state');
          });
        }

        // Handle HTMX after-swap event to show toast after successful submission
        document.body.addEventListener('htmx:afterSwap', function(event) {
          const target = event.detail.target;
          if (target && target.id === 'pulse-check-container') {
            // Check if we're now showing the success state
            if (target.classList.contains('pulse-success-state')) {
              // Extract emoji from the success message
              const emojiElement = target.querySelector('.pulse-status-emoji');
              const emoji = emojiElement ? emojiElement.textContent.trim() : '🙂';
              
              if (window.showToast) {
                window.showToast('Pulse saved', 'You selected ' + emoji + ' today.', 'success');
              }
            }
          }
        });
      })();
    </script>
  `;
}

/**
 * Render the Class Detail Page (Tabs + Content).
 * Matches demo/class.html layout.
 *
 * @param {Object} classInfo - Class data
 * @param {string} [activeTab='directory'] - Currently active tab
 * @param {string} [content=''] - HTML content for the active tab
 * @param {Object} [options={}] - Additional options
 * @param {boolean} [options.isStudent=false] - Whether current user is a student
 * @param {number|null} [options.currentPulse=null] - Current pulse value if student
 * @returns {string} HTML string
 */
export function renderClassDetail(
  classInfo,
  activeTab = "directory",
  content = "",
  options = {},
) {
  const {
    isStudent = false,
    currentPulse = null,
    isInstructor = false,
  } = options;
  return `
        <!-- Class Banner -->
        <div class="class-banner" style="background: linear-gradient(135deg, var(--color-brand-deep) 0%, var(--color-brand-medium) 100%); border-radius: var(--radius-lg); padding: var(--space-8); color: white; margin-bottom: var(--space-6); position: relative; overflow: hidden; min-height: 200px; padding-bottom: 100px;">
            <div class="class-header-content" style="position: relative; z-index: 1;">
                <span class="class-code" style="font-family: var(--font-mono); background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: var(--radius-full); font-size: var(--text-sm); display: inline-block; margin-bottom: var(--space-4); backdrop-filter: blur(4px);">${escapeHtml(classInfo.code || "CLASS")}</span>
                <h1 class="class-title" style="font-size: var(--text-3xl); font-weight: var(--weight-bold); margin-bottom: var(--space-2);">${escapeHtml(classInfo.name)}</h1>
                <div class="class-meta" style="display: flex; gap: var(--space-6); font-size: var(--text-sm); opacity: 0.9;">
                    <div class="class-meta-item"><i class="fa-regular fa-calendar"></i> ${escapeHtml(classInfo.quarter || "Current")}</div>
                    <div class="class-meta-item"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(classInfo.location || "Remote")}</div>
                    <div class="class-meta-item"><i class="fa-solid fa-users"></i> ${classInfo.studentCount || 0} Students</div>
                </div>
            </div>
            ${isStudent ? renderPulseCheck(classInfo.id, currentPulse) : ""}
            <!-- Quick Punch Action -->
            <button 
                id="class-punch-btn-${classInfo.id}" 
                class="btn-punch-me"
                style="position: absolute; right: 32px; bottom: 32px; background: var(--color-accent-gold); color: var(--color-brand-deep); padding: 12px 24px; border-radius: var(--radius-full); font-weight: bold; box-shadow: var(--shadow-lg); border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.2s; z-index: 10;"
                hx-post="/activity/quick-punch"
                hx-vals='{"classId": "${classInfo.id}"}'
                hx-swap="none"
                data-class-id="${classInfo.id}"
            >
                <i class="fa-solid fa-fingerprint"></i> Punch me
            </button>
        </div>

        <!-- Tabs (HTMX Controlled) -->
        <div class="page-tabs" style="display: flex; gap: var(--space-6); border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: var(--space-6);">
            <a href="/classes/${classInfo.id}/directory" 
               hx-get="/classes/${classInfo.id}/directory"
               hx-target="#tab-content"
               class="tab-item ${activeTab === "directory" ? "active" : ""}" 
               style="padding: var(--space-3) 0; color: ${activeTab === "directory" ? "var(--color-brand-deep)" : "var(--color-text-muted)"}; font-weight: var(--weight-medium); border-bottom: 2px solid ${activeTab === "directory" ? "var(--color-accent-gold)" : "transparent"}; cursor: pointer; text-decoration: none;">
               Directory
            </a>
            <a href="/attendance"
               class="tab-item ${activeTab === "attendance" ? "active" : ""}"
               style="padding: var(--space-3) 0; color: var(--color-text-muted); font-weight: var(--weight-medium); border-bottom: 2px solid transparent; cursor: pointer; text-decoration: none;">
               Attendance <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px; margin-left: 4px;"></i>
            </a>
            ${
              isInstructor
                ? `
            <a href="/classes/${classInfo.id}/pulse/page" 
               hx-get="/classes/${classInfo.id}/pulse/page?range=7"
               hx-target="#tab-content"
               class="tab-item ${activeTab === "pulse" ? "active" : ""}" 
               style="padding: var(--space-3) 0; color: ${activeTab === "pulse" ? "var(--color-brand-deep)" : "var(--color-text-muted)"}; font-weight: var(--weight-medium); border-bottom: 2px solid ${activeTab === "pulse" ? "var(--color-accent-gold)" : "transparent"}; cursor: pointer; text-decoration: none;">
               Pulse
            </a>
            `
                : ""
            }
            <a href="/classes/${classInfo.id}/settings"
               hx-get="/classes/${classInfo.id}/settings"
               hx-target="#tab-content"
               hx-swap="innerHTML"
               class="tab-item ${activeTab === "settings" ? "active" : ""}"
               style="padding: var(--space-3) 0; color: ${activeTab === "settings" ? "var(--color-brand-deep)" : "var(--color-text-muted)"}; font-weight: var(--weight-medium); border-bottom: 2px solid ${activeTab === "settings" ? "var(--color-accent-gold)" : "transparent"}; cursor: pointer; text-decoration: none;">
               Settings
            </a>
        </div>

        <!-- Tab Content -->
        <div id="tab-content" class="tab-pane active">
            ${content}
        </div>
        
        <script>
          (function() {
            // Handle quick punch-in button
            document.body.addEventListener('htmx:afterRequest', function(event) {
              const requestPath = event.detail?.pathInfo?.requestPath;
              const elt = event.detail?.elt;
              
              if (requestPath === '/activity/quick-punch' && elt && elt.classList.contains('btn-punch-me')) {
                const punchBtn = elt;
                const status = event.detail.xhr?.status;
                
                if (status === 201) {
                  // Show success toast
                  if (typeof showToast !== 'undefined') {
                    showToast('Success', 'Punched in for Lecture (1 hour)', 'success');
                  }
                  // Update button state
                  punchBtn.innerHTML = '<i class="fa-solid fa-check"></i> Punched In';
                  punchBtn.style.background = 'var(--color-status-success)';
                  punchBtn.style.color = 'white';
                  punchBtn.disabled = true;
                  // Reload page after a short delay to show new activity in profile
                  setTimeout(() => {
                    if (typeof htmx !== 'undefined') {
                      htmx.ajax('GET', window.location.pathname, {target: 'body', swap: 'none'});
                    } else {
                      window.location.reload();
                    }
                  }, 1500);
                } else if (status && status !== 201) {
                  if (typeof showToast !== 'undefined') {
                    showToast('Error', 'Failed to punch in. Please try again.', 'error');
                  }
                }
              }
            });
          })();
        </script>
    `;
}

/**
 * Render the class directory content (Tab Content)
 * @param {Object} data Directory data with professors, tas, tutors, groups, and students
 * @param {Object} [user] Current user object with isProf property
 * @returns {string} HTML
 */
export function renderClassDirectory(data, user = null) {
  if (!data) return "";

  const {
    professors = [],
    tas = [],
    tutors = [],
    groups = [],
    students = [],
  } = data;

  // Check if current user is a professor in THIS class (not globally)
  const isProf = user ? professors.some((prof) => prof.id === user.id) : false;

  /**
   * Generate role options for dropdown with protection logic
   * @param {Object} person Person data
   * @param {string} classId Class ID
   * @param {Object} user Current user
   * @param {number} professorCount Total professors in class
   * @returns {string} HTML for role options
   */
  function generateRoleOptions(person, classId, user, professorCount) {
    const isLastProfessor = professorCount === 1 && person.role === "PROFESSOR";
    const isSelf = person.id === user?.id;
    const cannotDemoteSelf = isLastProfessor && isSelf;

    const roles = [
      { value: "STUDENT", label: "Student" },
      { value: "TUTOR", label: "Tutor" },
      { value: "TA", label: "TA" },
      { value: "PROFESSOR", label: "Professor" },
    ];

    return roles
      .map((role) => {
        const isDisabled = cannotDemoteSelf && role.value !== "PROFESSOR";
        const disabledStyle = isDisabled
          ? "opacity: 0.5; cursor: not-allowed;"
          : "cursor: pointer;";
        const disabledAttr = isDisabled ? "disabled" : "";
        const title = isDisabled
          ? "Cannot demote yourself - you are the only professor"
          : "";

        return `
        <button class="role-option" 
                hx-put="/classRoles/${classId}/members/${person.id}/role" 
                hx-vals='{"role": "${role.value}"}' 
                hx-target="#tab-content" 
                hx-swap="innerHTML"
                ${disabledAttr}
                title="${title}"
                style="width: 100%; padding: 8px 12px; border: none; background: none; text-align: left; font-size: var(--text-sm); ${disabledStyle}">
          ${role.label}
        </button>
      `;
      })
      .join("");
  }

  /**
   * Helper function to render a person card with optional role management
   * @param {Object} person Person data
   * @param {string} classId Class ID for role change requests
   * @param {Object} user Current user object
   * @param {number} professorCount Total number of professors in the class
   * @returns {string} HTML for person card
   */
  function renderPersonCard(person, classId, user, professorCount) {
    const initials = person.preferredName
      ? person.preferredName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : person.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();

    // Role styling
    const roleStyles = {
      PROFESSOR: { bg: "#FEF3C7", color: "#D97706" },
      TA: { bg: "#E0F2FE", color: "#0284C7" },
      TUTOR: { bg: "#F3E8FF", color: "#9333EA" },
      STUDENT: {
        bg: "var(--color-bg-canvas)",
        color: "var(--color-text-muted)",
      },
    };
    const style = roleStyles[person.role] || roleStyles.STUDENT;

    return `
      <div class="member-card" style="background: var(--color-bg-surface); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm); position: relative; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)'" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'"
           onclick="window.location.href='/users/${person.id}/profile'">
        <div class="member-avatar" style="width: 56px; height: 56px; border-radius: 50%; background: ${style.bg}; color: ${style.color}; display: flex; align-items: center; justify-content: center; font-weight: bold;">
          ${escapeHtml(initials)}
        </div>
        <div class="member-info" style="flex: 1;">
          <div class="member-name" style="font-weight: bold;">${escapeHtml(person.preferredName || person.name)}</div>
          <div class="member-email" style="font-size: var(--text-sm); color: var(--color-text-muted);">${escapeHtml(person.email)}</div>
          <div class="member-role">
            <span class="role-badge" style="background: ${style.bg}; color: ${style.color}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
              ${person.role === "PROFESSOR" ? "Professor" : person.role === "TA" ? "TA" : person.role === "TUTOR" ? "Tutor" : "Student"}
            </span>
          </div>
        </div>
        ${
          isProf
            ? `
          <div class="role-management" style="position: absolute; top: 8px; right: 8px; z-index: 5;" onclick="event.stopPropagation();">
            <button class="role-change-btn" 
                    onclick="toggleRoleDropdown('${person.id}')" 
                    style="background: none; border: none; color: var(--color-text-muted); padding: 4px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                    title="Change role">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div id="role-dropdown-${person.id}" class="role-dropdown" style="display: none; position: absolute; right: 0; top: 100%; background: white; border: 1px solid var(--color-bg-canvas); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 10; min-width: 120px;">
              ${generateRoleOptions(person, classId, user, professorCount)}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  const classId = data.class?.id || "";
  const professorCount = professors.length;

  let html = "";

  // Professors Section
  if (professors.length > 0) {
    html += `
      <div class="directory-section" style="margin-bottom: var(--space-8);">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
            Professors <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${professors.length}</span>
          </div>
        </div>
        <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
          ${professors.map((prof) => renderPersonCard(prof, classId, user, professorCount)).join("")}
        </div>
      </div>
    `;
  }

  // TAs Section
  if (tas.length > 0) {
    html += `
      <div class="directory-section" style="margin-bottom: var(--space-8);">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
            Teaching Assistants <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${tas.length}</span>
          </div>
        </div>
        <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
          ${tas.map((ta) => renderPersonCard(ta, classId, user, professorCount)).join("")}
        </div>
      </div>
    `;
  }

  // Tutors Section
  if (tutors.length > 0) {
    html += `
      <div class="directory-section" style="margin-bottom: var(--space-8);">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
            Tutors <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${tutors.length}</span>
          </div>
        </div>
        <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
          ${tutors.map((tutor) => renderPersonCard(tutor, classId, user, professorCount)).join("")}
        </div>
      </div>
    `;
  }

  // Check if current user is a TA in THIS class
  const isTA = user ? tas.some((ta) => ta.id === user.id) : false;

  // Groups Section
  html += `
    <div class="directory-section" style="margin-bottom: var(--space-8);">
      <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
        <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
          Groups <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${groups.length}</span>
        </div>
        ${
          isProf || isTA
            ? `
          <a
            href="/classes/${classId}/groups/create-modal"
            class="btn btn--primary"
            style="padding: 8px 16px; font-size: var(--text-sm); display: inline-flex; align-items: center; gap: 8px; text-decoration: none;"
            hx-get="/classes/${classId}/groups/create-modal"
            hx-target="#modal-container"
            hx-swap="innerHTML"
            hx-trigger="click"
            role="button"
          >
            <i class="fa-solid fa-plus"></i>
            Create Group
          </a>
        `
            : ""
        }
      </div>
      ${
        groups.length > 0
          ? `
        <div class="groups-container" style="display: flex; flex-direction: column; gap: var(--space-6);">
          ${groups
            .map((group) => {
              // Check if current user is a leader of this group
              const isGroupLeader = user
                ? group.members.some((m) => m.id === user.id && m.isLeader)
                : false;

              return `
              <div class="group-section" style="background: var(--color-bg-surface); border-radius: var(--radius-md); padding: var(--space-4); box-shadow: var(--shadow-sm);">
                <div class="group-header" style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-bg-canvas);">
                  ${
                    group.logoUrl
                      ? `<img src="${escapeHtml(group.logoUrl)}" alt="${escapeHtml(group.name)}" style="width: 40px; height: 40px; border-radius: var(--radius-md); object-fit: cover;">`
                      : `<div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--color-brand-deep); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">${escapeHtml(group.name.charAt(0).toUpperCase())}</div>`
                  }
                  <div style="flex: 1;">
                    <div class="group-name" style="font-weight: var(--weight-bold); font-size: var(--text-lg);">${escapeHtml(group.name)}</div>
                    ${group.mantra ? `<div style="font-size: var(--text-sm); color: var(--color-text-muted); font-style: italic;">"${escapeHtml(group.mantra)}"</div>` : ""}
                  </div>
                  <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${group.members.length} members</span>
                  
                  <!-- Group Action Buttons -->
                  ${
                    isProf || isTA || isGroupLeader
                      ? `
                    <div class="group-actions" style="display: flex; gap: var(--space-2);">
                      ${
                        group.github
                          ? `
                        <a href="${escapeHtml(group.github)}" target="_blank" class="btn btn--secondary" style="padding: 6px 10px;" title="View GitHub">
                          <i class="fa-brands fa-github"></i>
                        </a>
                      `
                          : ""
                      }
                      <button 
                        class="btn btn--secondary" 
                        style="padding: 6px 10px;"
                        hx-get="/groups/${group.id}/edit-modal"
                        hx-target="#modal-container"
                        hx-swap="innerHTML"
                        title="Edit group"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      ${
                        isProf || isTA
                          ? `
                        <button 
                          class="btn btn--secondary" 
                          style="padding: 6px 10px;"
                          hx-get="/groups/${group.id}/manage"
                          hx-target="#modal-container"
                          hx-swap="innerHTML"
                          title="Manage members"
                        >
                          <i class="fa-solid fa-users-gear"></i>
                        </button>
                        <button 
                          class="btn btn--secondary" 
                          style="padding: 6px 10px; color: var(--color-status-error);"
                          hx-get="/groups/${group.id}/delete-modal"
                          hx-target="#modal-container"
                          hx-swap="innerHTML"
                          title="Delete group"
                        >
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      `
                          : ""
                      }
                    </div>
                  `
                      : ""
                  }
                </div>
                
                <!-- Supervisors -->
                ${
                  group.supervisors && group.supervisors.length > 0
                    ? `
                  <div style="margin-bottom: var(--space-3);">
                    <span style="font-size: var(--text-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Supervisors:</span>
                    <span style="font-size: var(--text-sm); margin-left: var(--space-2);">
                      ${group.supervisors.map((s) => escapeHtml(s.preferredName || s.name)).join(", ")}
                    </span>
                  </div>
                `
                    : ""
                }
                
                <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
                  ${group.members
                    .map((member) => {
                      const memberWithRole = { ...member, role: "STUDENT" };
                      return renderPersonCard(
                        memberWithRole,
                        classId,
                        user,
                        professorCount,
                      );
                    })
                    .join("")}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      `
          : `
        <div style="text-align: center; padding: var(--space-8); color: var(--color-text-muted); background: var(--color-bg-surface); border-radius: var(--radius-md);">
          <i class="fa-solid fa-users-rectangle" style="font-size: 48px; margin-bottom: var(--space-4); opacity: 0.3;"></i>
          <p style="margin-bottom: var(--space-4);">No groups have been created yet.</p>
          ${
            isProf || isTA
              ? `
            <button
              class="btn btn--primary"
              hx-get="/classes/${classId}/groups/create-modal"
              hx-target="#modal-container"
              hx-swap="innerHTML"
            >
              <i class="fa-solid fa-plus"></i> Create First Group
            </button>
          `
              : ""
          }
        </div>
      `
      }
    </div>
  `;

  // Students Section
  if (students.length > 0) {
    html += `
      <div class="directory-section">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
            Students <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">${students.length}</span>
          </div>
        </div>
        <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
          ${students.map((student) => renderPersonCard(student, classId, user, professorCount)).join("")}
        </div>
      </div>
    `;
  }

  // Add JavaScript for dropdown functionality
  html += `
    <script>
      function toggleRoleDropdown(userId) {
        // Close all other dropdowns first
        document.querySelectorAll('.role-dropdown').forEach(dropdown => {
          if (dropdown.id !== 'role-dropdown-' + userId) {
            dropdown.style.display = 'none';
          }
        });
        
        // Toggle the clicked dropdown
        const dropdown = document.getElementById('role-dropdown-' + userId);
        if (dropdown) {
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
      }
      // Close dropdowns when clicking outside
      document.addEventListener('click', function(event) {
        if (!event.target.closest('.role-management')) {
          document.querySelectorAll('.role-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
          });
        }
      });
      // Style dropdown options on hover
      document.querySelectorAll('.role-option').forEach(option => {
        option.addEventListener('mouseenter', function() {
          this.style.background = 'var(--color-bg-canvas)';
        });
        option.addEventListener('mouseleave', function() {
          this.style.background = 'none';
        });
      });
    </script>
  `;

  return html;
}

/**
 * Render the list of classes (My Classes Page)
 * Matches demo/my-classes.html structure
 * @param {Array} classes - List of class objects
 * @param {Object} [user=null] - Current user object with isProf property
 * @returns {string} HTML string
 */
export function renderClassList(classes, user = null) {
  // Header
  const headerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
            <h1 style="font-size: var(--text-2xl); font-weight: bold;">All Classes</h1>
            <div style="display: flex; gap: 12px;">
                <button style="background: white; border: 1px solid var(--color-bg-canvas); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; color: var(--color-text-muted);">
                    <i class="fa-solid fa-filter"></i> Filter
                </button>
            </div>
        </div>
    `;

  // Class Cards
  const classCardsHTML = classes
    .map((c) => {
      // Randomize gradient for demo purposes if not specified
      const gradients = [
        "linear-gradient(135deg, var(--color-brand-deep) 0%, var(--color-brand-medium) 100%)", // Green
        "linear-gradient(135deg, #1F2937 0%, #4B5563 100%)", // Gray
        "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)", // Blue
        "linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)", // Orange
      ];
      const bgStyle =
        c.color || gradients[Math.floor(Math.random() * gradients.length)];

      return `
        <div class="course-card-wrapper">
            <a href="/classes/${c.id}" class="course-card">
                <div class="course-header" style="background: ${bgStyle};">
                    <span class="course-badge">${escapeHtml(c.quarter || "Current")}</span>
                    ${c.isFavorite ? '<i class="fa-solid fa-star" style="color: rgba(255,255,255,0.5);"></i>' : ""}
                </div>
                <div class="course-body">
                    <div class="course-code">${escapeHtml(c.code || c.name.split(":")[0] || "CLASS")}</div>
                    <div class="course-title">${escapeHtml(c.name)}</div>
                    <div class="course-meta">
                        <div class="meta-item"><i class="fa-solid fa-users"></i> ${c.studentCount || 0}</div>
                        <div class="meta-item"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.location || "Online")}</div>
                    </div>
                </div>
            </a>
            <a href="/classes/${c.id}/schedule" class="course-calendar-link">
                <i class="fa-regular fa-calendar"></i> View Calendar
            </a>
        </div>
        `;
    })
    .join("");

  // Create/Join Class Card (Conditional based on user role)
  const isProf = user?.isProf === true;
  const createCardHTML = isProf
    ? `
        <button class="course-card create-card" onclick="window.openModal('modal-create-class')">
            <div class="create-icon">
                <i class="fa-solid fa-plus-circle"></i>
            </div>
            <span style="font-weight: bold;">Create Class</span>
        </button>
    `
    : `
        <button class="course-card create-card" onclick="window.openModal('modal-join-class')">
            <div class="create-icon">
                <i class="fa-solid fa-user-plus"></i>
            </div>
            <span style="font-weight: bold;">Join Class</span>
        </button>
    `;

  // Include appropriate modal based on user role
  const modalHTML = isProf
    ? createClassForm(getUpcomingQuarters())
    : createJoinClassModal();

  return `
        ${headerHTML}
        <div class="courses-grid">
            ${classCardsHTML}
            ${createCardHTML}
        </div>
        ${modalHTML}
    `;
}

/**
 * Create Class modal markup used on the class list page.
 *
 * @param {Array} [upcomingQuarters=[]] - Optional list of upcoming quarter codes
 * @returns {string} HTML string
 */
export function createClassForm(upcomingQuarters = []) {
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
                <button class="btn-close" onclick="window.closeModal('modal-create-class')">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <form 
                hx-post="/classes/create" 
                hx-target="#main-content" 
                hx-swap="innerHTML"
                onsubmit="window.closeModal('modal-create-class')"
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
                        <button type="button" class="btn btn--secondary" onclick="window.closeModal('modal-create-class')">Cancel</button>
                        <button type="submit" class="btn btn--primary">Create Class</button>
                    </div>
                </section>
            </form>
        </div>
    </div>
    `;
}

/**
 * Display Invite Modal/Link
 * @param {string} inviteUrl
 * @returns {string} HTML
 */
export function displayInvite(inviteUrl) {
  return `
        <div style="text-align: center; padding: 16px;">
            <div style="font-size: 48px; margin-bottom: 16px; color: var(--color-brand-medium);">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <h4 style="margin-bottom: 8px; font-size: 18px;">Class Created Successfully!</h4>
            <p style="color: var(--color-text-muted); margin-bottom: 16px;">Share this invite link with your students:</p>
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <input type="text" readonly value="${escapeHtml(inviteUrl)}" id="invite-url-input" class="form-input" style="flex: 1; font-size: 12px;" onclick="this.select()">
                <button type="button" class="btn btn--secondary" id="copy-invite-btn" onclick="copyInviteUrl()">
                    <i class="fa-solid fa-copy"></i> Copy
                </button>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button type="button" class="btn btn--secondary" onclick="closeModal('modal-create-class'); window.location.reload();">Close</button>
                <a href="/classes/my-classes" class="btn btn--primary">
                    <i class="fa-solid fa-arrow-right"></i> View My Classes
                </a>
            </div>
        </div>
        <script>
            function copyInviteUrl() {
                var input = document.getElementById('invite-url-input');
                var btn = document.getElementById('copy-invite-btn');
                input.select();
                input.setSelectionRange(0, 99999); // For mobile
                
                // Try modern API first, fallback to execCommand
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(input.value).then(function() {
                        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                    }).catch(function() {
                        // Fallback
                        document.execCommand('copy');
                        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                    });
                } else {
                    // Fallback for HTTP
                    document.execCommand('copy');
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                }
            }
            
            if (window.showToast) {
                window.showToast('Success', 'Class created successfully!', 'success');
            }
        </script>
    `;
}

/**
 * Render external emails list (helper function)
 * @param {Array} externalEmails - Array of external email objects
 * @param {string} classId - Class ID
 * @param {boolean} canManage - Whether user can manage external emails
 * @returns {string} HTML string
 */
export function renderExternalEmailsList(
  externalEmails = [],
  classId,
  canManage = false,
) {
  if (externalEmails.length === 0) {
    return `
      <div style="text-align: center; padding: var(--space-6); color: var(--color-text-muted);">
        <i class="fa-solid fa-inbox" style="font-size: 32px; margin-bottom: var(--space-2); opacity: 0.5;"></i>
        <p style="font-size: var(--text-sm);">No external emails added yet</p>
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: var(--space-2);">
      ${externalEmails
        .map(
          (item) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); background: var(--color-bg-surface); border-radius: var(--radius-md); border: 1px solid var(--color-bg-canvas);">
          <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1;">
            <i class="fa-solid fa-envelope" style="color: var(--color-text-muted);"></i>
            <span style="font-size: var(--text-sm); color: var(--color-text-main);">${escapeHtml(item.email)}</span>
          </div>
          ${
            canManage
              ? `
            <button
              type="button"
              class="btn btn-secondary"
              style="padding: 4px 8px; font-size: var(--text-xs);"
              hx-delete="/classes/${classId}/external-emails/${encodeURIComponent(item.email)}"
              hx-target="#external-emails-list"
              hx-swap="innerHTML"
              hx-confirm="Remove this external email?"
              title="Remove email"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          `
              : ""
          }
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

/**
 * Render Class Settings Page
 * @param {Object} klass - Class object with inviteCode
 * @param {string} inviteUrl - Full invite URL
 * @param {Array} [externalEmails=[]] - Array of external email objects
 * @param {boolean} [canManage=false] - Whether user can manage external emails
 * @returns {string} HTML string
 */
export function renderClassSettings(
  klass,
  inviteUrl,
  externalEmails = [],
  canManage = false,
) {
  const inviteCode = klass.inviteCode || "";

  return `
    <div class="pulse-analytics-container">
      <div class="pulse-analytics-header" style="margin-bottom: var(--space-6);">
        <h2 style="font-size: var(--text-2xl); font-weight: var(--weight-bold);">
          Class Settings
        </h2>
      </div>

      <!-- Invite Code Section -->
      <div class="bento-card" style="margin-bottom: var(--space-6);">
        <div class="card-header" style="margin-bottom: var(--space-4);">
          <div class="card-title">
            <i class="fa-solid fa-link"></i>
            Invite Code
          </div>
        </div>
        <div class="card-content">
          <p style="color: var(--color-text-muted); font-size: var(--text-sm); margin-bottom: var(--space-6);">
            Share this invite code or link with students to allow them to join this class.
          </p>
          
          <div style="margin-bottom: var(--space-6);">
            <label style="display: block; font-size: var(--text-sm); font-weight: var(--weight-medium); margin-bottom: var(--space-2); color: var(--color-text-main);">
              Invite Code
            </label>
            <div style="display: flex; gap: var(--space-2);">
              <input 
                type="text" 
                readonly 
                value="${escapeHtml(inviteCode)}" 
                id="invite-code-input" 
                class="form-input" 
                style="flex: 1; font-family: var(--font-mono); font-size: var(--text-base); font-weight: var(--weight-semibold); letter-spacing: 1px;"
                onclick="this.select()"
              >
              <button 
                type="button" 
                class="btn btn-secondary" 
                id="copy-invite-code-btn" 
                onclick="copyInviteCode()"
                style="white-space: nowrap;"
              >
                <i class="fa-solid fa-copy"></i> Copy
              </button>
            </div>
          </div>
          
          <div>
            <label style="display: block; font-size: var(--text-sm); font-weight: var(--weight-medium); margin-bottom: var(--space-2); color: var(--color-text-main);">
              Invite Link
            </label>
            <div style="display: flex; gap: var(--space-2);">
              <input 
                type="text" 
                readonly 
                value="${escapeHtml(inviteUrl)}" 
                id="invite-url-input" 
                class="form-input" 
                style="flex: 1; font-size: var(--text-sm);"
                onclick="this.select()"
              >
              <button 
                type="button" 
                class="btn btn-secondary" 
                id="copy-invite-url-btn" 
                onclick="copyInviteUrl()"
                style="white-space: nowrap;"
              >
                <i class="fa-solid fa-copy"></i> Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- External Emails Section (only for professors/TAs) -->
      ${
        canManage
          ? `
      <div class="bento-card" style="margin-bottom: var(--space-6);">
        <div class="card-header" style="margin-bottom: var(--space-4);">
          <div class="card-title">
            <i class="fa-solid fa-envelope-circle-check"></i>
            External Emails
          </div>
        </div>
        <div class="card-content">
          <p style="color: var(--color-text-muted); font-size: var(--text-sm); margin-bottom: var(--space-6);">
            Add external email addresses that should be allowed to login to this portal. These emails will be able to access the system even if they're not @ucsd.edu addresses.
          </p>
          
          <!-- Add External Email Form -->
          <form
            id="add-external-email-form"
            hx-post="/classes/${klass.id}/external-emails"
            hx-target="#external-emails-list"
            hx-swap="innerHTML"
            style="margin-bottom: var(--space-6);"
          >
            <div style="display: flex; gap: var(--space-2);">
              <input
                type="email"
                name="email"
                class="form-input"
                placeholder="example@external.com"
                required
                style="flex: 1;"
                pattern="[^@]+@[^@]+\\.[^@]+"
              >
              <button type="submit" class="btn btn-primary" style="white-space: nowrap;">
                <i class="fa-solid fa-plus"></i> Add Email
              </button>
            </div>
            <p class="form-helper" style="margin-top: var(--space-2); font-size: var(--text-xs);">
              Note: UCSD emails (@ucsd.edu) are already allowed and don't need to be added.
            </p>
          </form>
          
          <!-- External Emails List -->
          <div>
            <label style="display: block; font-size: var(--text-sm); font-weight: var(--weight-medium); margin-bottom: var(--space-2); color: var(--color-text-main);">
              Allowed External Emails
            </label>
            <div id="external-emails-list">
              ${renderExternalEmailsList(externalEmails, klass.id, canManage)}
            </div>
          </div>
        </div>
      </div>
      `
          : ""
      }

      <!-- Class Information Section -->
    </div>

    <script>
      function copyInviteCode() {
        var input = document.getElementById('invite-code-input');
        var btn = document.getElementById('copy-invite-code-btn');
        input.select();
        input.setSelectionRange(0, 99999);
        
        var copyText = function() {
          var originalHtml = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
          btn.style.background = 'var(--color-status-success)';
          btn.style.color = 'white';
          setTimeout(function() {
            btn.innerHTML = originalHtml;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        };
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(input.value).then(copyText).catch(function() {
            document.execCommand('copy');
            copyText();
          });
        } else {
          document.execCommand('copy');
          copyText();
        }
      }
      
      function copyInviteUrl() {
        var input = document.getElementById('invite-url-input');
        var btn = document.getElementById('copy-invite-url-btn');
        input.select();
        input.setSelectionRange(0, 99999);
        
        var copyText = function() {
          var originalHtml = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
          btn.style.background = 'var(--color-status-success)';
          btn.style.color = 'white';
          setTimeout(function() {
            btn.innerHTML = originalHtml;
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
        };
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(input.value).then(copyText).catch(function() {
            document.execCommand('copy');
            copyText();
          });
        } else {
          document.execCommand('copy');
          copyText();
        }
      }
      
      // Update active tab state when settings loads
      (function() {
        // Mark settings tab as active
        const settingsTab = document.querySelector('a[href*="/settings"]');
        if (settingsTab) {
          // Remove active from all tabs
          document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
            tab.style.color = 'var(--color-text-muted)';
            tab.style.borderBottom = '2px solid transparent';
          });
          
          // Mark settings tab as active
          settingsTab.classList.add('active');
          settingsTab.style.color = 'var(--color-brand-deep)';
          settingsTab.style.borderBottom = '2px solid var(--color-accent-gold)';
        }
      })();
      
      // Handle external email form submission
      (function() {
        const form = document.getElementById('add-external-email-form');
        if (form) {
          document.body.addEventListener('htmx:afterRequest', function(event) {
            if (event.detail.target && event.detail.target.id === 'external-emails-list') {
              const status = event.detail.xhr?.status;
              const emailInput = form.querySelector('input[name=email]');
              
              if (status === 201) {
                // Success - clear input and show toast
                if (emailInput) {
                  emailInput.value = '';
                }
                if (typeof showToast !== 'undefined') {
                  showToast('Success', 'External email added successfully', 'success');
                }
              } else if (status && status >= 400) {
                // Error - show error message
                const responseText = event.detail.xhr?.responseText || 'Failed to add external email';
                if (typeof showToast !== 'undefined') {
                  showToast('Error', responseText, 'error');
                } else {
                  alert('Error: ' + responseText);
                }
              }
            }
          });
        }
      })();
    </script>
  `;
}
