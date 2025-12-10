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
 * @param {Array} professorCourses - List of courses where user is professor (with attendance sessions)
 * @param {Array} studentCourses - List of courses where user is student (for dropdown and cards)
 * @param {Array} studentHistory - Student's attendance history (for student view)
 * @param {Object} emptyStateFlags - Flags indicating whether data exists
 * @param {boolean} emptyStateFlags.hasProfessorCourses - Whether user is a professor in any courses
 * @param {boolean} emptyStateFlags.hasStudentCourses - Whether user is a student in any courses
 * @param {boolean} emptyStateFlags.hasAttendanceRecords - Whether user has any attendance records
 * @returns {string} HTML string
 */
export function renderAttendancePage(
  user,
  professorCourses = [],
  studentCourses = [],
  studentHistory = [],
  emptyStateFlags = {},
) {
  const {
    hasProfessorCourses = false,
    hasStudentCourses = false,
    hasAttendanceRecords = false,
  } = emptyStateFlags;

  // Determine which views to show based on user's roles
  // - If user has no student classes: show only "Create Attendance" (professor view)
  // - If user has only student classes: show only "Fill Attendance" (student view)
  // - If user has mixed roles: show both tabs
  const showCreateAttendance = hasProfessorCourses;
  const showFillAttendance = hasStudentCourses;
  const showBothTabs = showCreateAttendance && showFillAttendance;

  // Default to "Create Attendance" if both are available, otherwise show the only available one
  const defaultView = showBothTabs
    ? "create"
    : showCreateAttendance
      ? "create"
      : "fill";

  return `
    <div class="container">
      <!-- Role Switcher -->
      ${
        showBothTabs
          ? `
      <div class="role-switcher">
        <button class="btn-role ${defaultView === "create" ? "active" : ""}" onclick="switchAttendanceView('create')">Create Attendance</button>
        <button class="btn-role ${defaultView === "fill" ? "active" : ""}" onclick="switchAttendanceView('fill')">Fill Attendance</button>
      </div>
      `
          : ""
      }

      <!-- Create Attendance View (for Professors/TAs) -->
      ${
        showCreateAttendance
          ? `
      <div id="view-create" class="view-section ${defaultView === "create" ? "" : "hidden"}">
        ${renderProfessorView(professorCourses, hasProfessorCourses)}
      </div>
      `
          : ""
      }

      <!-- Fill Attendance View (for Students) -->
      ${
        showFillAttendance
          ? `
      <div id="view-fill" class="view-section ${defaultView === "fill" ? "" : "hidden"}">
        ${renderStudentView(studentHistory, studentCourses, user?.id, hasStudentCourses, hasAttendanceRecords)}
      </div>
      `
          : ""
      }
    </div>

    <!-- Modals -->
    ${renderCreateSessionModal()}
    ${renderLivePollModal()}

    <div id="dialog"></div>
    <script>
      function switchAttendanceView(role) {
        document.querySelectorAll('.btn-role').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
        
        if (role === 'create') {
          const createBtn = document.querySelector('button[onclick*="create"]');
          if (createBtn) createBtn.classList.add('active');
          const createView = document.getElementById('view-create');
          if (createView) createView.style.display = 'block';
        } else if (role === 'fill') {
          const fillBtn = document.querySelector('button[onclick*="fill"]');
          if (fillBtn) fillBtn.classList.add('active');
          const fillView = document.getElementById('view-fill');
          if (fillView) fillView.style.display = 'block';
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

      function openLivePoll(code) {
        document.querySelector('.live-code').textContent = code;
        openModal('modal-live-poll');
      }

      window.toggleDropdown = function(event, dropdownId) {
        event.stopPropagation();
        const dropdown = document.getElementById(dropdownId);
        const isOpen = dropdown.classList.contains('dropdown-open');
        const button = event.target.closest('.dropdown-toggle') || event.target.closest('.btn-icon');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          menu.classList.remove('dropdown-open', 'dropdown-menu-top');
        });
        
        // Toggle this dropdown
        if (!isOpen) {
          // First, open it to measure its height
          dropdown.classList.add('dropdown-open');
          
          // Use requestAnimationFrame to ensure the dropdown is rendered before measuring
          requestAnimationFrame(() => {
            if (!button) return;
            
            const buttonRect = button.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;
            const dropdownHeight = dropdownRect.height || 100; // Fallback estimate
            
            // If not enough space below but enough space above, flip upward
            // Add some padding (20px) to ensure it doesn't touch viewport edge
            if (spaceBelow < dropdownHeight + 20 && spaceAbove > dropdownHeight + 20) {
              dropdown.classList.add('dropdown-menu-top');
            } else {
              dropdown.classList.remove('dropdown-menu-top');
            }
          });
        }
      };

      // Close dropdowns when clicking outside
      document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-container')) {
          document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('dropdown-open', 'dropdown-menu-top');
          });
        }
      });

      // Close all dropdowns when a modal opens
      document.addEventListener('htmx:afterSwap', function(event) {
        // Check if a modal was just opened
        if (event.target.id === 'dialog' && event.detail.target.querySelector('.modal-overlay')) {
          document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('dropdown-open', 'dropdown-menu-top');
          });
        }
        
        // Initialize dropdowns after session list updates
        // Check if the swap updated a course content div (where sessions render)
        if (event.target && (event.target.classList.contains('course-content') || event.target.id.startsWith('content-') || event.target.querySelector('.data-table'))) {
          initializeSessionDropdowns();
          initializeSessionActions();
        }
        
        // Also check if a session row was swapped
        if (event.target && event.target.id && event.target.id.startsWith('session-row-')) {
          initializeSessionDropdowns();
          initializeSessionActions();
        }
        
        // Check if entire table was swapped
        if (event.target && event.target.classList && event.target.classList.contains('data-table')) {
          initializeSessionDropdowns();
          initializeSessionActions();
        }
      });
      
      // Initialize session dropdowns (ensures proper icon and event listeners)
      window.initializeSessionDropdowns = function() {
        // Find all dropdown containers in session tables
        document.querySelectorAll('.data-table .dropdown-container').forEach(container => {
          const button = container.querySelector('.dropdown-toggle');
          const dropdown = container.querySelector('.dropdown-menu');
          
          if (!button || !dropdown) return;
          
          // Ensure the icon is three dots (ellipsis-v), not hamburger
          const icon = button.querySelector('i');
          if (icon && !icon.classList.contains('fa-ellipsis-v')) {
            icon.className = 'fa-solid fa-ellipsis-v';
          }
          
          // Ensure onclick handler is properly set
          const dropdownId = dropdown.id;
          if (dropdownId) {
            // Use a function wrapper to avoid escaping issues
            button.onclick = function(e) {
              toggleDropdown(e, dropdownId);
            };
          }
        });
      };
      
      // Initialize session action buttons (Start Poll & View Records)
      // Ensures HTMX processes new elements and event handlers are properly attached
      window.initializeSessionActions = function() {
        // HTMX automatically processes new elements with hx-* attributes when added to DOM
        // Explicitly process elements to ensure they work immediately after swaps
        if (typeof htmx !== 'undefined' && htmx.process) {
          document.querySelectorAll('.data-table [hx-get], .data-table [hx-post], .data-table [hx-put], .data-table [hx-delete]').forEach(element => {
            try {
              // Process element with HTMX if it exists
              htmx.process(element);
            } catch (e) {
              // Ignore errors - HTMX might have already processed it
            }
          });
        }
        
        // Ensure dropdown items properly close the dropdown when clicked
        // This ensures dropdown closes after Start Poll or View Records is clicked
        document.querySelectorAll('.data-table .dropdown-item').forEach(item => {
          // Skip if listener already added (using data attribute to track)
          if (item.dataset.actionListenerAdded === 'true') return;
          
          // Add click handler to close dropdown after navigation/action
          item.addEventListener('click', function(e) {
            // Close the dropdown after a short delay to allow HTMX/navigation to trigger
            const self = this;
            setTimeout(() => {
              const dropdownContainer = self.closest('.dropdown-container');
              if (dropdownContainer) {
                const dropdown = dropdownContainer.querySelector('.dropdown-menu');
                if (dropdown) {
                  dropdown.classList.remove('dropdown-open', 'dropdown-menu-top');
                }
              }
            }, 200);
          });
          
          // Mark as processed to avoid duplicate listeners
          item.dataset.actionListenerAdded = 'true';
        });
      };

      // Also close dropdowns when modal overlay is clicked or opened via JS
      const originalOpenModal = window.openModal;
      if (originalOpenModal) {
        window.openModal = function(modalId) {
          // Close all dropdowns before opening modal
          document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('dropdown-open', 'dropdown-menu-top');
          });
          originalOpenModal(modalId);
        };
      }

      // Update countdown timers for active polls
      function updateCountdowns() {
        document.querySelectorAll('tr[data-expires-at]').forEach(row => {
          const expiresAt = parseInt(row.getAttribute('data-expires-at'));
          const timeElement = row.querySelector('.time-remaining');
          if (!timeElement) return;
          
          const now = Date.now();
          const diff = Math.max(0, Math.floor((expiresAt - now) / 1000)); // seconds
          
          if (diff === 0) {
            // Poll expired, update status
            const statusPill = row.querySelector('.status-pill');
            if (statusPill) {
              statusPill.className = 'status-pill status-expired';
              statusPill.textContent = 'Expired';
            }
            timeElement.remove();
            row.removeAttribute('data-expires-at');
            return;
          }
          
          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;
          timeElement.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
        });
      }

      // Update countdowns every second
      setInterval(updateCountdowns, 1000);
      updateCountdowns(); // Initial update
      
      // Initialize dropdowns and actions on page load
      initializeSessionDropdowns();
      initializeSessionActions();
      
      // Initialize session form validations when modal opens
      function initializeSessionForm() {
        const dateInput = document.getElementById('session-date');
        const startTimeInput = document.getElementById('session-start-time');
        const endTimeInput = document.getElementById('session-end-time');
        
        if (!dateInput) return;
        
        // Disable past dates based on PST timezone
        const pstDate = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
        const today = new Date(pstDate);
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.min = yyyy + '-' + mm + '-' + dd;
        
        // Validate end time is after start time
        function validateSessionTimes() {
          if (!startTimeInput || !endTimeInput) return;
          
          const startTime = startTimeInput.value;
          const endTime = endTimeInput.value;
          
          if (startTime && endTime && endTime <= startTime) {
            endTimeInput.setCustomValidity("End time must be after start time");
          } else {
            endTimeInput.setCustomValidity("");
          }
        }
        
        if (startTimeInput) {
          startTimeInput.addEventListener('change', validateSessionTimes);
          startTimeInput.addEventListener('input', validateSessionTimes);
        }
        
        if (endTimeInput) {
          endTimeInput.addEventListener('change', validateSessionTimes);
          endTimeInput.addEventListener('input', validateSessionTimes);
        }
      }
      
      // Initialize form when create session modal opens
      const originalOpenCreateSessionModal = window.openCreateSessionModal;
      if (originalOpenCreateSessionModal) {
        window.openCreateSessionModal = function(classId) {
          originalOpenCreateSessionModal(classId);
          // Wait a bit for modal to render, then initialize form
          setTimeout(initializeSessionForm, 100);
        };
      }
      
      // Also initialize if modal is already open (e.g., on page load)
      setTimeout(initializeSessionForm, 500);
    </script>
  `;
}

/**
 * Create Start Attendance modal HTML for a given session.
 * Pure frontend/dummy implementation used for HTMX.
 *
 * @param {string} sessionId - Target session ID
 * @param {string|number} courseIdOrDuration - Course/class ID (new) or duration (legacy)
 * @param {number} [durationMinutes] - Poll duration in minutes (only for new signature)
 * @returns {string} HTML string for the start-attendance modal
 */
export function createStartAttendanceModal(
  sessionId,
  courseIdOrDuration,
  durationMinutes,
) {
  // Handle both new signature (sessionId, courseId, durationMinutes) and legacy (sessionId, durationMinutes)
  let courseId;
  let duration;

  if (typeof courseIdOrDuration === "string") {
    // New signature: (sessionId, courseId, durationMinutes)
    courseId = courseIdOrDuration;
    duration = durationMinutes;
  } else {
    // Legacy signature: (sessionId, durationMinutes)
    courseId = null;
    duration = courseIdOrDuration;
  }

  const formAction = courseId
    ? `/course/${escapeHtml(courseId)}/session/${escapeHtml(sessionId)}/poll/start`
    : `/attendance/poll/create`;
  const formTarget = courseId
    ? `#session-row-${escapeHtml(sessionId)}`
    : "#main-content";
  const formSwap = courseId ? "outerHTML" : "innerHTML";

  return `
    <div id="modal-start-attendance" class="modal-overlay open">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Start Attendance Poll</h3>
          <button class="btn-close" onclick="closeModal('modal-start-attendance'); document.getElementById('dialog').innerHTML = '';">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          hx-post="${formAction}"
          hx-target="${formTarget}"
          hx-swap="${formSwap}"
          hx-on::after-request="closeModal('modal-start-attendance'); document.getElementById('dialog').innerHTML = '';"
        >
          ${courseId ? "" : `<input type="hidden" name="sessionId" value="${escapeHtml(sessionId)}">`}
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Expiry Time (minutes)</label>
              <input 
                type="number" 
                class="form-input" 
                name="durationMinutes" 
                min="1" 
                max="1440" 
                value="${duration}"
                required
              >
              <small class="form-help-text">
                The attendance code will be automatically generated after submission
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-start-attendance')">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary">
              Start Poll
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
 * @param {boolean} hasProfessorCourses - Whether user is a professor in any courses
 * @returns {string} HTML string
 */
function renderProfessorView(courses, hasProfessorCourses) {
  // If no professor courses, show empty state
  if (!hasProfessorCourses || courses.length === 0) {
    return `
      <div class="page-header">
        <h1>Course Attendance</h1>
      </div>
      <div class="empty-state">
        <p>You are not a professor in any courses.</p>
      </div>
    `;
  }

  return `
    <div class="page-header">
      <h1>Course Attendance</h1>
    </div>

    ${courses.map((course, idx) => renderCourseCard(course, idx === 0)).join("")}
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
    <div class="bento-card span-4">
      <div class="card-header" onclick="toggleCourse('${course.id}')">
        <div class="card-title">
          <i class="fa-solid fa-chevron-${expanded ? "down" : "right"}" id="icon-${course.id}"></i>
          ${escapeHtml(course.name)}
          ${course.quarter ? `<span class="badge badge-soft">${escapeHtml(course.quarter)}</span>` : ""}
          ${hasActiveSessions ? '<span class="badge badge-active">LIVE</span>' : ""}
        </div>
        <div class="card-action">
          <button class="btn btn--primary btn--small" onclick="event.stopPropagation(); openCreateSessionModal('${course.classId || course.id}')">
            + New Session
          </button>
          <a href="/course/${escapeHtml(course.classId || course.id)}/records"
             hx-get="/course/${escapeHtml(course.classId || course.id)}/records"
             hx-target="#main-content"
             hx-swap="innerHTML"
             hx-push-url="true"
             class="btn btn--small btn-secondary"
             onclick="event.stopPropagation();">
            View Records
          </a>
        </div>
      </div>

      <div id="content-${course.id}" class="course-content ${expanded ? "" : "hidden"}">
        ${course.sessions?.length > 0 ? renderSessionsTable(course.sessions, course.classId || course.id) : renderEmptySessions()}
      </div>
    </div>
  `;
}

/**
 * Render sessions table for a single course.
 *
 * @param {Array} sessions - List of session objects
 * @param {string} courseId - Course/class ID for building URLs
 * @returns {string} HTML string
 */
function renderSessionsTable(sessions, courseId) {
  return `
    <table class="data-table" id="session-table">
      <thead>
        <tr>
          <th>Session Name</th>
          <th>Date / Time</th>
          <th>Code</th>
          <th>Status</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sessions.map((s) => renderSessionRow(s, courseId)).join("")}
      </tbody>
    </table>
  `;
}

/**
 * Render a single session row within the sessions table.
 *
 * @param {Object} session - Session row data
 * @param {string} courseId - Course/class ID for building URLs
 * @returns {string} HTML string
 */
function renderSessionRow(session, courseId) {
  const statusClass =
    session.status === "active" ? "status-active" : "status-expired";
  const statusLabel = session.status === "active" ? "Active" : "Expired";

  // Calculate time remaining if active
  let timeRemaining = "";
  let expiresAtTimestamp = "";
  if (session.status === "active" && session.expiresAt) {
    const expires = new Date(session.expiresAt);
    expiresAtTimestamp = expires.getTime().toString();
    const now = new Date();
    const diff = Math.max(0, Math.floor((expires - now) / 1000)); // seconds
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    timeRemaining = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return `
    <tr id="session-row-${escapeHtml(session.id)}" ${expiresAtTimestamp ? `data-expires-at="${expiresAtTimestamp}"` : ""}>
      <td><strong>${escapeHtml(session.name)}</strong></td>
      <td>${escapeHtml(session.date)} • ${escapeHtml(session.time)}</td>
      <td class="font-mono">${escapeHtml(session.code)}</td>
      <td>
        <span class="status-pill ${statusClass}">${statusLabel}</span>
        ${timeRemaining ? `<span class="time-remaining">${timeRemaining}</span>` : ""}
      </td>
      <td class="actions-cell">
        <div class="dropdown-container">
          <button class="btn-icon dropdown-toggle" type="button" onclick="toggleDropdown(event, 'dropdown-${escapeHtml(session.id)}')">
            <i class="fa-solid fa-ellipsis-v"></i>
          </button>
          <div class="dropdown-menu" id="dropdown-${escapeHtml(session.id)}">
            <a class="dropdown-item" 
               hx-get="/course/${escapeHtml(courseId)}/session/${escapeHtml(session.id)}/poll/new"
               hx-target="#dialog"
               hx-swap="innerHTML"
               hx-trigger="click"
               onclick="event.stopPropagation(); toggleDropdown(event, 'dropdown-${escapeHtml(session.id)}');">
              <i class="fa-solid fa-play"></i> Start Poll
            </a>
            <a class="dropdown-item" 
               href="/course/${escapeHtml(courseId)}/session/${escapeHtml(session.id)}/records"
               hx-get="/course/${escapeHtml(courseId)}/session/${escapeHtml(session.id)}/records"
               hx-target="#main-content"
               hx-swap="innerHTML"
               hx-push-url="true"
               onclick="event.stopPropagation(); toggleDropdown(event, 'dropdown-${escapeHtml(session.id)}');">
              <i class="fa-solid fa-list"></i> View Records
            </a>
          </div>
        </div>
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
    <div class="empty-sessions">
      No active sessions. Create one to start taking attendance.
    </div>
  `;
}

/**
 * Render student attendance history view.
 * Shows Mark Attendance form, History section, and course cards.
 *
 * @param {Array} history - Grouped attendance history
 * @param {Array} courses - List of enrolled courses for dropdown and course cards
 * @param {string} userId - User ID for building attendance record URLs
 * @param {boolean} hasStudentCourses - Whether user is a student in any courses
 * @param {boolean} hasAttendanceRecords - Whether user has any attendance records
 * @returns {string} HTML string
 */
function renderStudentView(
  history,
  courses = [],
  userId = null,
  hasStudentCourses = false,
  hasAttendanceRecords = false,
) {
  return `
    <div class="attendance-student-grid">
      <!-- Code Input Card -->
      <div class="bento-card span-2">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-qrcode"></i> Mark Attendance</div>
        </div>
        <div class="card-content flex-center">
          <div id="student-input-form">
            ${renderStudentAttendanceForm({ courses })}
          </div>
        </div>
      </div>

      <!-- History Card -->
      <div class="bento-card span-2 row-span-2">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> History</div>
        </div>
        <div class="history-list">
          ${
            hasStudentCourses && hasAttendanceRecords && history.length > 0
              ? history.map((group) => renderHistoryGroup(group)).join("")
              : `<div class="empty-state">
                <p>No attendance records available.</p>
              </div>`
          }
        </div>
      </div>
    </div>

    <!-- Course Cards Section (New Feature) -->
    ${
      courses && courses.length > 0
        ? `
      <div class="course-grid-container">
        <div class="page-header" style="margin-bottom: var(--space-4);">
          <h2>My Courses</h2>
        </div>
        <div class="course-grid">
          ${courses.map((course) => renderStudentCourseCard(course, userId)).join("")}
        </div>
      </div>
    `
        : ""
    }
  `;
}

/**
 * Render a single course card for student view.
 *
 * @param {Object} course - Course object with id, name, quarter
 * @param {string} userId - User ID for building attendance record URLs
 * @returns {string} HTML string
 */
function renderStudentCourseCard(course, userId) {
  // userId should always be provided, but handle gracefully if not
  if (!userId) {
    console.warn(
      "renderStudentCourseCard: userId not provided, cannot create attendance link",
    );
    return `
      <div class="bento-card student-course-card">
        <div class="card-header">
          <div class="card-title">
            ${escapeHtml(course.name)}
            ${course.quarter ? `<span class="badge badge-soft">${escapeHtml(course.quarter)}</span>` : ""}
          </div>
        </div>
        <div class="card-content flex-between">
          <div class="student-course-card-content">
            ${course.code ? `<p>${escapeHtml(course.code)}</p>` : ""}
          </div>
          <div>
            <button class="btn btn--primary btn--full" disabled>
              <i class="fa-solid fa-list"></i> View Attendance
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="bento-card student-course-card">
      <div class="card-header">
        <div class="card-title">
          ${escapeHtml(course.name)}
          ${course.quarter ? `<span class="badge badge-soft">${escapeHtml(course.quarter)}</span>` : ""}
        </div>
      </div>
      <div class="card-content flex-between">
        <div class="student-course-card-content">
          ${course.code ? `<p>${escapeHtml(course.code)}</p>` : ""}
        </div>
        <div>
          <a href="/course/${escapeHtml(course.id)}/user/${escapeHtml(userId)}/records"
             hx-get="/course/${escapeHtml(course.id)}/user/${escapeHtml(userId)}/records"
             hx-target="#main-content"
             hx-swap="innerHTML"
             hx-push-url="true"
             class="btn btn--primary btn--full">
            <i class="fa-solid fa-list"></i> View Attendance
          </a>
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
        <form id="create-session-form" onsubmit="handleCreateSession(event)">
          <div class="modal-body">
            <input type="hidden" id="session-class-id" name="classId" required>
            <div class="form-group">
              <label class="form-label">Session Name <span class="required-asterisk">*</span></label>
              <input type="text" class="form-input" id="session-name" name="name" placeholder="e.g. Week 6: Testing Strategies" required>
            </div>
            <div class="form-group">
              <label class="form-label">Date <span class="required-asterisk">*</span></label>
              <input type="date" class="form-input" id="session-date" name="date" required>
            </div>
            <div class="form-group form-group-flex">
              <div>
                <label class="form-label">Start Time</label>
                <input type="time" class="form-input" id="session-start-time" name="startTime">
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input type="time" class="form-input" id="session-end-time" name="endTime">
              </div>
            </div>
            <div id="session-form-error" class="alert alert--error" style="display: none;"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-create-session')">Cancel</button>
            <button type="submit" class="btn btn--primary" id="session-submit-btn">Create</button>
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

/**
 * Render session records page with attendance data and percentage circle
 *
 * @param {Object} data - Records page data
 * @param {string} data.sessionId - Session ID
 * @param {string} data.sessionName - Session name
 * @param {string} data.courseId - Course/class ID
 * @param {string} data.courseName - Course name
 * @param {Array} data.students - List of enrolled students
 * @param {Array} data.attendance - List of attendance records
 * @returns {string} HTML string
 */
export function renderSessionRecordsPage(data) {
  const { sessionName, courseName, students, attendance } = data;

  // Create a map of attendance records by student ID
  const attendanceMap = new Map();
  attendance.forEach((record) => {
    attendanceMap.set(record.studentId, record);
  });

  // Calculate attendance percentage
  const totalStudents = students.length;
  const presentCount = attendance.length;
  const attendancePercentage =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Calculate circumference for circle (radius = 50, so circumference = 2 * PI * 50 = 314.16)
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (attendancePercentage / 100) * circumference;

  return `
    <div class="container">
      <div class="records-page-header">
        <div>
          <a href="/attendance">
            ← Back to Attendance
          </a>
          <h1>${escapeHtml(sessionName)}</h1>
          <p>${escapeHtml(courseName)}</p>
        </div>
      </div>

      <div class="bento-card span-4 full-width">
        <div class="card-header">
          <div class="card-title">Attendance Overview</div>
        </div>
        <div class="card-content flex-align-center">
          <!-- Circular Percentage Indicator -->
          <div class="attendance-circle-container size-120">
            <svg class="attendance-circle" width="120" height="120">
              <circle 
                class="attendance-circle-bg" 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="var(--color-brand-light)" 
                stroke-width="8"
              />
              <circle 
                class="attendance-circle-progress" 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="var(--color-brand-deep)" 
                stroke-width="8"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div class="attendance-circle-text">
              <div class="attendance-circle-percentage size-2xl">${attendancePercentage}%</div>
              <div class="attendance-circle-label size-xs">Attendance</div>
            </div>
          </div>
          
          <!-- Stats -->
          <div style="flex: 1;">
            <div class="stats-grid">
              <div>
                <div class="stats-item">${presentCount}</div>
                <div class="stats-label">Present</div>
              </div>
              <div>
                <div class="stats-item">${totalStudents - presentCount}</div>
                <div class="stats-label">Absent</div>
              </div>
              <div>
                <div class="stats-item">${totalStudents}</div>
                <div class="stats-label">Total Enrolled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bento-card span-4 full-width">
        <div class="card-header">
          <div class="card-title">Student Records</div>
        </div>
        <div class="card-content overflow-auto">
          <table class="data-table full-width">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email / ID</th>
                <th>Poll Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${students
                .map((student) => {
                  const record = attendanceMap.get(student.id);
                  const status = record ? "Present" : "Absent";
                  const statusClass = record
                    ? "status-present"
                    : "status-absent";
                  const timestamp =
                    record && record.markedAt
                      ? new Date(record.markedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--";

                  return `
                  <tr>
                    <td><strong>${escapeHtml(student.name)}</strong></td>
                    <td>${escapeHtml(student.email || student.id)}</td>
                    <td class="font-mono timestamp">${escapeHtml(timestamp)}</td>
                    <td>
                      <span class="status-badge ${statusClass}">${status}</span>
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Export renderSessionRow for use in controllers
export { renderSessionRow };

/**
 * Render the student attendance form with course dropdown
 * @param {Object} options - Form options
 * @param {Array} options.courses - List of enrolled courses
 * @param {string} [options.selectedCourseId] - Currently selected course ID
 * @param {string} [options.code] - Code value to preserve
 * @param {string} [options.error] - Error message to display
 * @returns {string} HTML string
 */
export function renderStudentAttendanceForm({
  courses = [],
  selectedCourseId = "",
  code = "",
  error = null,
}) {
  // Format code with space for display
  const displayCode = code
    ? code.replace(/\s/g, "").replace(/(\d{4})(\d{4})/, "$1 $2")
    : "";

  return `
    <p class="student-form-text">
      Select your course and enter the 8-digit code provided by your professor.
    </p>
    
    ${
      error
        ? `
      <div class="alert alert--error alert-error" role="alert">
        <strong>Error:</strong> ${escapeHtml(error)}
      </div>
    `
        : ""
    }
    
    <form 
      id="attendance-mark-form"
      hx-post="/attendance/mark"
      hx-target="#student-input-form"
      hx-swap="innerHTML"
      hx-indicator="#attendance-submit-btn"
    >
      <div class="form-group form-group-spaced">
        <label class="form-label" for="course-select">Course</label>
        <select 
          class="form-select" 
          id="course-select" 
          name="courseId" 
          required
        >
          <option value="">-- Select a course --</option>
          ${courses
            .map(
              (course) => `
            <option value="${escapeHtml(course.id)}" ${selectedCourseId === course.id ? "selected" : ""}>
              ${escapeHtml(course.name)}${course.quarter ? ` (${escapeHtml(course.quarter)})` : ""}
            </option>
          `,
            )
            .join("")}
        </select>
      </div>
      
      <div class="form-group form-group-spaced">
        <label class="form-label" for="attendance-code-input">Attendance Code</label>
        <div class="input-code-wrapper">
          <input 
            type="text" 
            class="big-input" 
            id="attendance-code-input"
            name="code"
            placeholder="0000 0000" 
            value="${escapeHtml(displayCode)}"
            maxlength="8"
            required
          >
        </div>
      </div>
      
      <button 
        type="submit" 
        class="btn btn--primary btn--full" 
        id="attendance-submit-btn"
      >
        Submit Code
      </button>
    </form>
  `;
}

/**
 * Render success message after marking attendance
 * @param {Object} options - Success options
 * @param {string} options.courseName - Course name
 * @param {string} options.sessionName - Session name
 * @param {Date|string} options.markedAt - Timestamp when attendance was marked
 * @param {boolean} [options.alreadyMarked] - Whether this was already marked
 * @returns {string} HTML string
 */
export function renderStudentAttendanceSuccess({
  courseName,
  sessionName,
  markedAt,
  alreadyMarked = false,
}) {
  const markedAtDate = new Date(markedAt);
  const timeStr = markedAtDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div class="success-message">
      <div class="success-icon-lg">
        <i class="fa-solid fa-check"></i>
      </div>
      <h3>${alreadyMarked ? "Already Checked In!" : "You're Checked In!"}</h3>
      <p class="text-muted">${escapeHtml(courseName)}</p>
      <p class="text-muted-sm">${escapeHtml(sessionName)}</p>
      <p class="text-muted-xs">
        ${alreadyMarked ? "Previously marked at" : "Marked at"} ${timeStr}
      </p>
    </div>
  `;
}

// Export for backward compatibility with existing attendance controller
export {
  renderProfessorView as displayProfessorAttendancePage,
  renderStudentView as displayStudentAttendanceGrouped,
};

/**
 * Render student attendance records page for a specific course
 * Shows attendance percentage circle, attendance table, and back button
 *
 * @param {Object} data - Records page data
 * @param {string} data.courseId - Course/class ID
 * @param {string} data.courseName - Course name
 * @param {string} data.userId - Student user ID
 * @param {string} data.userName - Student name
 * @param {Array} data.sessions - List of course sessions with attendance status
 * @param {number} data.attendancePercentage - Overall attendance percentage
 * @returns {string} HTML string
 */
export function renderStudentAttendanceRecordsPage(data) {
  const { courseName, sessions, attendancePercentage } = data;

  // Calculate circumference for circle (radius = 70, so circumference = 2 * PI * 70)
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (attendancePercentage / 100) * circumference;

  /**
   * Format session date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatSessionDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return `
    <div class="container">
      <div class="records-page-header">
        <div>
          <a href="/attendance" 
             hx-get="/attendance"
             hx-target="#main-content"
             hx-swap="innerHTML"
             hx-push-url="true">
            ← Back to Courses
          </a>
          <h1>Attendance Records</h1>
          <p>${escapeHtml(courseName)}</p>
        </div>
      </div>

      <!-- Attendance Summary Circle -->
      <div class="bento-card span-4">
        <div class="card-header">
          <div class="card-title">Attendance Summary</div>
        </div>
        <div class="card-content flex-justify-center">
          <div class="attendance-circle-container size-160">
            <svg class="attendance-circle" width="160" height="160">
              <circle 
                class="attendance-circle-bg" 
                cx="80" 
                cy="80" 
                r="70" 
                fill="none" 
                stroke="var(--color-brand-light)" 
                stroke-width="12"
              />
              <circle 
                class="attendance-circle-progress" 
                cx="80" 
                cy="80" 
                r="70" 
                fill="none" 
                stroke="var(--color-brand-deep)" 
                stroke-width="12"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div class="attendance-circle-text">
              <div class="attendance-circle-percentage size-3xl">${attendancePercentage}%</div>
              <div class="attendance-circle-label size-sm">Attendance</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="bento-card span-4">
        <div class="card-header">
          <div class="card-title">Session Records</div>
        </div>
        <div class="card-content">
          <table class="data-table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Session Date</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                sessions.length > 0
                  ? sessions
                      .map((session) => {
                        const isPresent = session.isPresent || false;
                        return `
                  <tr>
                    <td><strong>${escapeHtml(session.name)}</strong></td>
                    <td>${escapeHtml(formatSessionDate(session.date))}</td>
                    <td class="text-center">
                      ${
                        isPresent
                          ? '<span class="status-icon-success">✔️</span>'
                          : '<span class="status-icon-error">❌</span>'
                      }
                    </td>
                  </tr>
                `;
                      })
                      .join("")
                  : `
                <tr>
                  <td colspan="3" class="text-center-small">
                    No sessions found for this course.
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render course attendance records page with pivoted table (students as rows, sessions as columns)
 * @param {Object} data - Records page data
 * @param {string} data.courseId - Course/class ID
 * @param {string} data.courseName - Course name
 * @param {Array} data.sessions - List of course sessions
 * @param {Array} data.students - List of enrolled students with attendance data
 * @returns {string} HTML string
 */
export function displayCourseRecordsPage(data) {
  const { courseName, sessions, students } = data;

  /**
   * Format session date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatSessionDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Format session header (name and date)
   * @param {Object} session - Session object with name and date
   * @returns {string} Formatted HTML string
   */
  const formatSessionHeader = (session) => {
    const dateStr = formatSessionDate(session.date);
    return `${escapeHtml(session.name)}<br><span class="session-header">${dateStr}</span>`;
  };

  /**
   * Calculate attendance percentage for a student
   * @param {Object} student - Student object with sessionAttendance
   * @returns {number} Attendance percentage (0-100)
   */
  const calculateAttendancePercentage = (student) => {
    const totalSessions = sessions.length;
    if (totalSessions === 0) return 0;

    let presentCount = 0;
    sessions.forEach((session) => {
      if (student.sessionAttendance[session.id]) {
        presentCount++;
      }
    });

    return Math.round((presentCount / totalSessions) * 100);
  };

  return `
    <div class="container">
      <div class="records-page-header">
        <div>
          <a href="/attendance" 
             hx-get="/attendance"
             hx-target="#main-content"
             hx-swap="innerHTML"
             hx-push-url="true">
            ← Back to Attendance
          </a>
          <h1>Attendance Records</h1>
          <p>${escapeHtml(courseName)}</p>
        </div>
      </div>

      <div class="bento-card span-4 full-width course-records-table">
        <div class="card-header">
          <div class="card-title">Student Attendance Overview</div>
        </div>
        <div class="card-content overflow-auto">
          <table class="data-table full-width">
            <thead>
              <tr>
                <th class="sticky-left">Student Name</th>
                ${sessions
                  .map(
                    (session) => `
                  <th class="session-header-cell">
                    ${formatSessionHeader(session)}
                  </th>
                `,
                  )
                  .join("")}
                <th class="percentage-header">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${students
                .map((student) => {
                  const attendancePercentage =
                    calculateAttendancePercentage(student);
                  return `
                  <tr>
                    <td class="sticky-left">
                      <div class="student-name">${escapeHtml(student.name)}</div>
                      <div class="student-email">${escapeHtml(student.email)}</div>
                    </td>
                    ${sessions
                      .map((session) => {
                        const isPresent =
                          !!student.sessionAttendance[session.id];
                        return `
                        <td class="text-center">
                          ${isPresent ? '<span class="status-icon-success">✔️</span>' : '<span class="status-icon-error">❌</span>'}
                        </td>
                      `;
                      })
                      .join("")}
                    <td class="percentage-cell">
                      ${attendancePercentage}%
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
