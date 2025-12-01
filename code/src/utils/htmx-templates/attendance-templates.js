/**
 * HTMX Templates for Attendance Page
 * code/src/utils/htmx-templates/attendance-templates.js
 *
 * Based on demo/attendance.html
 * Per NOTES: UI for prof and student has to be separated
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Render the main attendance page
 * @param {Object} user - User object
 * @param {Array} courses - List of courses with attendance sessions
 * @param {Array} studentHistory - Student's attendance history (for student view)
 * @returns {string} HTML string
 */
export function renderAttendancePage(user, courses = [], studentHistory = []) {
  // Check if user is professor/TA (can manage attendance)
  const isProf =
    (user && user.isProf) ||
    (user && user.role === "PROFESSOR") ||
    (user && user.role === "TA");

  return `
    <div class="container">
      <!-- Role Switcher (Demo Only) -->
      <div class="role-switcher" style="margin-bottom: var(--space-6);">
        <button class="btn-role ${isProf ? "active" : ""}" onclick="switchAttendanceView('professor')">Professor View</button>
        <button class="btn-role ${!isProf ? "active" : ""}" onclick="switchAttendanceView('student')">Student View</button>
      </div>

      <!-- Professor View -->
      <div id="view-professor" class="view-section" style="display: ${isProf ? "block" : "none"};">
        ${renderProfessorView(courses)}
      </div>

      <!-- Student View -->
      <div id="view-student" class="view-section" style="display: ${!isProf ? "block" : "none"};">
        ${renderStudentView(studentHistory)}
      </div>
    </div>

    <!-- Modals -->
    ${renderCreateSessionModal()}
    ${renderLivePollModal()}

    <script>
      function switchAttendanceView(role) {
        document.querySelectorAll('.btn-role').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
        
        if (role === 'professor') {
          document.querySelector('button[onclick*="professor"]').classList.add('active');
          document.getElementById('view-professor').style.display = 'block';
        } else {
          document.querySelector('button[onclick*="student"]').classList.add('active');
          document.getElementById('view-student').style.display = 'block';
        }
      }

      function toggleCourse(courseId) {
        const content = document.getElementById('content-' + courseId);
        const icon = document.getElementById('icon-' + courseId);
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          icon.className = 'fa-solid fa-chevron-down';
        } else {
          content.style.display = 'none';
          icon.className = 'fa-solid fa-chevron-right';
        }
      }

      function submitAttendanceCode() {
        const input = document.getElementById('attendance-code-input');
        if (input.value.replace(/\\s/g, '').length < 8) {
          showToast('Invalid Code', 'Please enter a valid 8-digit code.', 'error');
          return;
        }
        
        // TODO: Backend integration - submit code via HTMX
        document.getElementById('student-input-form').style.opacity = '0.5';
        setTimeout(() => {
          document.getElementById('student-input-form').style.display = 'none';
          document.getElementById('student-success-msg').style.display = 'block';
          showToast('Success', 'Attendance marked successfully!', 'success');
        }, 800);
      }

      function openLivePoll(code) {
        document.querySelector('.live-code').textContent = code;
        openModal('modal-live-poll');
      }
    </script>
  `;
}

/**
 * Create Start Attendance modal HTML for a given session.
 * Pure frontend/dummy implementation used for HTMX.
 *
 * @param {string} sessionId - Target session ID
 * @param {number} durationMinutes - Poll duration in minutes
 * @returns {string} HTML string for the start-attendance modal
 */
export function createStartAttendanceModal(sessionId, durationMinutes) {
  return `
    <div id="modal-start-attendance" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Start Attendance</h3>
          <button class="btn-close" onclick="closeModal('modal-start-attendance')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-post="/attendance/polls"
          hx-target="#main-content"
          hx-swap="innerHTML"
          onsubmit="closeModal('modal-start-attendance')"
        >
          <div class="modal-body">
            <input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}">
            <div class="form-group">
              <label class="form-label">Duration (minutes)</label>
              <input 
                type="number" 
                class="form-input" 
                name="durationMinutes" 
                min="1" 
                max="1440" 
                value="${durationMinutes}"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-start-attendance')">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary">
              Start Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Render professor attendance overview with course list.
 *
 * @param {Array} courses - List of course objects
 * @returns {string} HTML string
 */
function renderProfessorView(courses) {
  // Mock courses if none provided
  const displayCourses =
    courses.length > 0
      ? courses
      : [
          {
            id: "cse210",
            name: "CSE 210: Software Engineering",
            quarter: "FA25",
            sessions: [
              {
                id: "s1",
                name: "Week 5: Design Patterns",
                date: "Nov 23, 2025",
                time: "10:00 AM",
                code: "8392 1045",
                status: "active",
              },
              {
                id: "s2",
                name: "Week 4: Architecture",
                date: "Nov 16, 2025",
                time: "10:00 AM",
                code: "9921 0034",
                status: "expired",
              },
            ],
          },
          {
            id: "cse110",
            name: "CSE 110: Software Engineering (Undergrad)",
            quarter: "FA25",
            sessions: [],
          },
        ];

  return `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
      <h1 style="font-size: var(--text-2xl); color: var(--color-brand-deep); font-weight: bold;">
        Course Attendance
      </h1>
    </div>

    ${displayCourses.map((course, idx) => renderCourseCard(course, idx === 0)).join("")}
  `;
}

/**
 * Render a single course card and its sessions table.
 *
 * @param {Object} course - Course data including sessions
 * @param {boolean} [expanded=true] - Whether course is initially expanded
 * @returns {string} HTML string
 */
function renderCourseCard(course, expanded = true) {
  // Check if course has any active sessions
  const hasActiveSessions =
    course.sessions && course.sessions.some((s) => s.status === "active");

  return `
    <div class="bento-card span-4" style="margin-bottom: var(--space-6);">
      <div class="card-header" onclick="toggleCourse('${course.id}')" style="cursor: pointer;">
        <div class="card-title">
          <i class="fa-solid fa-chevron-${expanded ? "down" : "right"}" id="icon-${course.id}"></i>
          ${escapeHtml(course.name)}
          ${course.quarter ? `<span class="badge badge-soft">${escapeHtml(course.quarter)}</span>` : ""}
          ${hasActiveSessions ? '<span class="badge badge-active">LIVE</span>' : ""}
        </div>
        <div class="card-action">
          <button class="btn btn--primary btn--small" onclick="event.stopPropagation(); openModal('modal-create-session')">
            + New Session
          </button>
        </div>
      </div>

      <div id="content-${course.id}" class="course-content" style="display: ${expanded ? "block" : "none"};">
        ${course.sessions?.length > 0 ? renderSessionsTable(course.sessions) : renderEmptySessions()}
      </div>
    </div>
  `;
}

/**
 * Render sessions table for a single course.
 *
 * @param {Array} sessions - List of session objects
 * @returns {string} HTML string
 */
function renderSessionsTable(sessions) {
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Session Name</th>
          <th>Date / Time</th>
          <th>Code</th>
          <th>Status</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sessions.map((s) => renderSessionRow(s)).join("")}
      </tbody>
    </table>
  `;
}

/**
 * Render a single session row within the sessions table.
 *
 * @param {Object} session - Session row data
 * @returns {string} HTML string
 */
function renderSessionRow(session) {
  const statusClass =
    session.status === "active" ? "status-active" : "status-expired";
  const statusLabel = session.status === "active" ? "Active" : "Expired";

  return `
    <tr>
      <td><strong>${escapeHtml(session.name)}</strong></td>
      <td>${escapeHtml(session.date)} • ${escapeHtml(session.time)}</td>
      <td class="font-mono">${escapeHtml(session.code)}</td>
      <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
      <td class="actions-cell">
        ${
          session.status === "active"
            ? `<button class="btn-icon" title="View Live Poll" onclick="openLivePoll('${escapeHtml(session.code)}')">
                <i class="fa-solid fa-tower-broadcast"></i>
              </button>`
            : ""
        }
        <button class="btn-icon" title="View Records">
          <i class="fa-solid fa-list"></i>
        </button>
      </td>
    </tr>
  `;
}

/**
 * Render empty state when no sessions exist for a course.
 *
 * @returns {string} HTML string
 */
function renderEmptySessions() {
  return `
    <div style="padding: var(--space-4); text-align: center; color: var(--color-text-muted);">
      No active sessions. Create one to start taking attendance.
    </div>
  `;
}

/**
 * Render student attendance history view.
 *
 * @param {Array} history - Grouped attendance history
 * @returns {string} HTML string
 */
function renderStudentView(history) {
  // Mock history if none provided
  const displayHistory =
    history.length > 0
      ? history
      : [
          {
            course: "CSE 210",
            rate: "92%",
            records: [
              {
                date: "Nov 16",
                session: "Week 4: Architecture",
                time: "10:05 AM",
                status: "present",
              },
              {
                date: "Nov 09",
                session: "Week 3: Agile Methods",
                time: "10:02 AM",
                status: "present",
              },
            ],
          },
          {
            course: "CSE 202",
            rate: "85%",
            records: [
              {
                date: "Nov 22",
                session: "Dynamic Programming",
                time: "--:--",
                status: "absent",
              },
            ],
          },
        ];

  return `
    <div class="attendance-student-grid">
      <!-- Code Input Card -->
      <div class="bento-card span-2">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-qrcode"></i> Mark Attendance</div>
        </div>
        <div class="card-content" style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
          <div id="student-input-form">
            <p style="color: var(--color-text-muted); margin-bottom: var(--space-4);">
              Enter the 8-digit code provided by your professor.
            </p>
            <div class="input-code-wrapper">
              <input type="text" class="big-input" placeholder="0000 0000" maxlength="9" id="attendance-code-input">
            </div>
            <button class="btn btn--primary btn--full" onclick="submitAttendanceCode()">Submit Code</button>
          </div>

          <!-- Success State (Hidden) -->
          <div id="student-success-msg" style="display: none; text-align: center; animation: fadeIn 0.5s;">
            <div class="success-icon-lg"><i class="fa-solid fa-check"></i></div>
            <h3 style="color: var(--color-brand-deep);">You're Checked In!</h3>
            <p class="text-muted">Session marked successfully</p>
          </div>
        </div>
      </div>

      <!-- History Card -->
      <div class="bento-card span-2 row-span-2">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> History</div>
        </div>
        <div class="history-list">
          ${displayHistory.map((group) => renderHistoryGroup(group)).join("")}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a grouped history block for a single course.
 *
 * @param {Object} group - History group (course + records)
 * @returns {string} HTML string
 */
function renderHistoryGroup(group) {
  return `
    <div class="history-group">
      <div class="history-group-header">${escapeHtml(group.course)} (${escapeHtml(group.rate)})</div>
      ${group.records.map((r) => renderHistoryItem(r)).join("")}
    </div>
  `;
}

/**
 * Render a single history record row.
 *
 * @param {Object} record - Individual attendance record
 * @returns {string} HTML string
 */
function renderHistoryItem(record) {
  const statusClass =
    record.status === "present" ? "status-present" : "status-absent";
  const statusLabel = record.status === "present" ? "Present" : "Absent";

  return `
    <div class="history-item">
      <div class="history-date">${escapeHtml(record.date)}</div>
      <div class="history-details">
        <div class="history-title">${escapeHtml(record.session)}</div>
        <div class="history-time">${escapeHtml(record.time)}</div>
      </div>
      <div class="status-badge ${statusClass}">${statusLabel}</div>
    </div>
  `;
}

/**
 * Render modal for creating a new attendance session.
 *
 * @returns {string} HTML string
 */
function renderCreateSessionModal() {
  return `
    <div id="modal-create-session" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Create Session</h3>
          <button class="btn-close" onclick="closeModal('modal-create-session')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-post="/attendance/sessions"
          hx-target="#main-content"
          hx-swap="innerHTML"
          onsubmit="closeModal('modal-create-session')"
        >
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Session Name</label>
              <input type="text" class="form-input" name="name" placeholder="e.g. Week 6: Testing Strategies" required>
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" name="date" required>
            </div>
            <div class="form-group" style="display: flex; gap: 12px;">
              <div style="flex: 1;">
                <label class="form-label">Start Time</label>
                <input type="time" class="form-input" name="startTime" required>
              </div>
              <div style="flex: 1;">
                <label class="form-label">End Time</label>
                <input type="time" class="form-input" name="endTime" required>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-create-session')">Cancel</button>
            <button type="submit" class="btn btn--primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Render live poll modal used during active attendance session.
 *
 * @returns {string} HTML string
 */
function renderLivePollModal() {
  return `
    <div id="modal-live-poll" class="modal-overlay live-poll-overlay">
      <div class="live-poll-card">
        <div class="live-header">
          <span class="live-badge">
            <div class="pulsing-dot"></div> LIVE SESSION
          </span>
          <button class="btn-close-white" onclick="closeModal('modal-live-poll')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div class="live-code-container">
          <div class="live-code">---- ----</div>
          <div class="live-timer-ring">
            <svg class="progress-ring" width="120" height="120">
              <circle class="progress-ring__circle" stroke="white" stroke-width="4" fill="transparent" r="52" cx="60" cy="60" />
            </svg>
            <span class="live-time">05:00</span>
          </div>
        </div>

        <div class="live-stats-row">
          <div class="stat-box">
            <div class="stat-val">0</div>
            <div class="stat-lbl">Present</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">0%</div>
            <div class="stat-lbl">Attendance Rate</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function createSessionForm() {}
export function displayAttendanceResult() {}
export function displayCourseRecordsPage() {}
export function displaySessionRecordsPage() {}
export function displaySessionAttendance() {}
export function displayCourseAttendanceSummary() {}
export function getCodeStatusFragment() {}
export function displayCourseItem() {}

// Export for backward compatibility with existing attendance controller
export {
  renderProfessorView as displayProfessorAttendancePage,
  renderStudentView as displayStudentAttendanceGrouped,
};
