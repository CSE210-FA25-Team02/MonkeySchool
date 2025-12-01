/**
 * HTMX Templates for Class Management
 * code/src/utils/htmx-templates/classes-templates.js
 */

import { escapeHtml, getUpcomingQuarters } from "../html-templates.js";

/**
 * Render the Class Detail Page (Tabs + Content).
 * Matches demo/class.html layout.
 *
 * @param {Object} classInfo - Class data
 * @param {string} [activeTab='directory'] - Currently active tab
 * @param {string} [content=''] - HTML content for the active tab
 * @returns {string} HTML string
 */
export function renderClassDetail(
  classInfo,
  activeTab = "directory",
  content = "",
) {
  return `
        <!-- Class Banner -->
        <div class="class-banner" style="background: linear-gradient(135deg, var(--color-brand-deep) 0%, var(--color-brand-medium) 100%); border-radius: var(--radius-lg); padding: var(--space-8); color: white; margin-bottom: var(--space-6); position: relative; overflow: hidden;">
            <div class="class-header-content" style="position: relative; z-index: 1;">
                <span class="class-code" style="font-family: var(--font-mono); background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: var(--radius-full); font-size: var(--text-sm); display: inline-block; margin-bottom: var(--space-4); backdrop-filter: blur(4px);">${escapeHtml(classInfo.code || "CLASS")}</span>
                <h1 class="class-title" style="font-size: var(--text-3xl); font-weight: var(--weight-bold); margin-bottom: var(--space-2);">${escapeHtml(classInfo.name)}</h1>
                <div class="class-meta" style="display: flex; gap: var(--space-6); font-size: var(--text-sm); opacity: 0.9;">
                    <div class="class-meta-item"><i class="fa-regular fa-calendar"></i> ${escapeHtml(classInfo.quarter || "Current")}</div>
                    <div class="class-meta-item"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(classInfo.location || "Remote")}</div>
                    <div class="class-meta-item"><i class="fa-solid fa-users"></i> ${classInfo.studentCount || 0} Students</div>
                </div>
            </div>
            <!-- Quick Punch Action -->
            <button id="class-punch-btn" style="position: absolute; right: 32px; bottom: 32px; background: var(--color-accent-gold); color: var(--color-brand-deep); padding: 12px 24px; border-radius: var(--radius-full); font-weight: bold; box-shadow: var(--shadow-lg); border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.2s;">
                <i class="fa-solid fa-fingerprint"></i> Punch In
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
            <a href="/classes/${classInfo.id}/attendance"
               class="tab-item ${activeTab === "attendance" ? "active" : ""}"
               style="padding: var(--space-3) 0; color: var(--color-text-muted); font-weight: var(--weight-medium); border-bottom: 2px solid transparent; cursor: pointer; text-decoration: none;">
               Attendance <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px; margin-left: 4px;"></i>
            </a>
            <a href="/classes/${classInfo.id}/groups"
               class="tab-item ${activeTab === "groups" ? "active" : ""}"
               style="padding: var(--space-3) 0; color: var(--color-text-muted); font-weight: var(--weight-medium); border-bottom: 2px solid transparent; cursor: pointer; text-decoration: none;">
               Groups
            </a>
            <a href="/classes/${classInfo.id}/settings"
               class="tab-item ${activeTab === "settings" ? "active" : ""}"
               style="padding: var(--space-3) 0; color: var(--color-text-muted); font-weight: var(--weight-medium); border-bottom: 2px solid transparent; cursor: pointer; text-decoration: none;">
               Settings
            </a>
        </div>

        <!-- Tab Content -->
        <div id="tab-content" class="tab-pane active">
            ${content}
        </div>
    `;
}

/**
 * Render the class directory content (Tab Content)
 * @param {Object} data
 * @returns {string} HTML
 */
// eslint-disable-next-line no-unused-vars
export function renderClassDirectory(data) {
  // Mock implementation of Directory Tab content (as seen in demo/class.html)
  return `
        <!-- Teaching Staff -->
        <div class="directory-section" style="margin-bottom: var(--space-8);">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
                    Teaching Staff <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">2</span>
                </div>
            </div>
            <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
                <!-- Mock Staff Cards -->
                <div class="member-card" style="background: var(--color-bg-surface); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm);">
                    <div class="member-avatar" style="width: 56px; height: 56px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        GG
                    </div>
                    <div class="member-info">
                        <div class="member-name" style="font-weight: bold;">Gary Gillespie</div>
                        <div class="member-role"><span class="role-badge role-prof" style="background: #FEF3C7; color: #D97706; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">Professor</span></div>
                    </div>
                </div>
                 <div class="member-card" style="background: var(--color-bg-surface); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm);">
                    <div class="member-avatar" style="width: 56px; height: 56px; border-radius: 50%; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        TA
                    </div>
                    <div class="member-info">
                        <div class="member-name" style="font-weight: bold;">Teaching Assistant</div>
                        <div class="member-role"><span class="role-badge role-ta" style="background: #E0F2FE; color: #0284C7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">TA</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Students -->
        <div class="directory-section">
             <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                <div class="section-title" style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-main);">
                    Students <span class="count-badge" style="background: var(--color-bg-canvas); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); color: var(--color-text-muted);">48</span>
                </div>
            </div>
            <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);">
                <div class="member-card" style="background: var(--color-bg-surface); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm);">
                    <div class="member-avatar" style="width: 56px; height: 56px; border-radius: 50%; background: var(--color-bg-canvas); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ST
                    </div>
                    <div class="member-info">
                        <div class="member-name" style="font-weight: bold;">Student Name</div>
                        <div class="member-role"><span class="role-badge role-student" style="background: var(--color-bg-canvas); color: var(--color-text-muted); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">Student</span></div>
                    </div>
                </div>
                 <!-- More mock students -->
            </div>
        </div>
     `;
}

/**
 * Render the list of classes (My Classes Page)
 * Matches demo/my-classes.html structure
 * @param {Array} classes - List of class objects
 * @returns {string} HTML string
 */
export function renderClassList(classes) {
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

  // Create New Class Card (Always appended)
  const createCardHTML = `
        <button class="course-card create-card" onclick="window.openModal('modal-create-class')">
            <div class="create-icon">
                <i class="fa-solid fa-plus-circle"></i>
            </div>
            <span style="font-weight: bold;">Create / Join Class</span>
        </button>
    `;

  return `
        ${headerHTML}
        <div class="courses-grid">
            ${classCardsHTML}
            ${createCardHTML}
        </div>
        ${createClassForm(getUpcomingQuarters())}
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
    ? upcomingQuarters.map((q) => `<option value="${q.code}">${q.full}</option>`).join("")
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
