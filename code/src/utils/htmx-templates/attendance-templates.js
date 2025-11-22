/**
 * HTMX Templates for Attendance System
 * code/src/utils/htmx-templates/attendance-templates.js
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Create a modal form to start attendance for a session
 */
export function createStartAttendanceModal(sessionId, defaultDuration = 10) {
  return `
    <section id="attendance-modal" class="attendance-modal__overlay">
      <div class="attendance-modal">
        <h2>Start Attendance</h2>
        <form 
          hx-post="/attendance/poll/create" 
          hx-target="#attendance-modal" 
          hx-swap="outerHTML"
        >
          <input type="hidden" name="sessionId" value="${sessionId}">
          <label class="attendance-modal__label">
            Duration (minutes):
            <input 
              type="number" 
              name="durationMinutes" 
              class="attendance-modal__input" 
              value="${defaultDuration}"
              min="1"
              max="1440"
            >
          </label>
          
          <div class="attendance-modal__actions">
            <button type="submit" class="attendance-modal__button attendance-modal__button--primary">
              Start Attendance
            </button>
            <button 
              type="button" 
              class="attendance-modal__button attendance-modal__button--secondary"
              hx-on:click="
                event.preventDefault();
                event.stopPropagation();
                const modal = document.getElementById('attendance-modal');
                if(modal) {
                  modal.style.transition = 'opacity 0.15s ease-out';
                  modal.style.opacity = '0';
                  setTimeout(function() {
                    if(modal && modal.parentNode) {
                      modal.remove();
                    }
                  }, 150);
                }
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  `;
}

/**
 * Display the generated attendance code with timer
 */
export function displayAttendanceCode(poll) {
  const expiresAt = new Date(poll.expiresAt);
  const now = new Date();
  const secondsRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  
  return `
    <section id="attendance-modal" class="attendance-modal__overlay">
      <div class="attendance-modal attendance-modal--code">
        <h2>Attendance Code</h2>
        <div class="attendance-code">
          <div class="attendance-code__display" id="attendance-code-display">
            ${poll.code}
          </div>
          <div class="attendance-code__timer" id="attendance-code-timer">
            Expires in: <span id="timer-seconds">${secondsRemaining}</span> seconds
          </div>
          <button 
            id="copy-code-btn" 
            class="attendance-code__copy-btn"
            aria-label="Copy attendance code"
          >
            Copy Code
          </button>
        </div>
        <div class="attendance-modal__actions">
          <button 
            type="button" 
            class="attendance-modal__button attendance-modal__button--secondary" 
            onclick="document.getElementById('attendance-modal')?.remove()"
          >
            Close
          </button>
        </div>
      </div>
    </section>
    <script>
      // Timer countdown
      let timeLeft = ${secondsRemaining};
      const timerElement = document.getElementById('timer-seconds');
      const timerInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) {
          timerElement.textContent = timeLeft;
        }
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          if (timerElement) {
            timerElement.textContent = 'Expired';
          }
        }
      }, 1000);

      // Copy code functionality
      const copyBtn = document.getElementById('copy-code-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const code = '${poll.code}';
          navigator.clipboard.writeText(code)
            .then(() => {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => {
                copyBtn.textContent = 'Copy Code';
              }, 2000);
            })
            .catch(err => console.error('Clipboard error:', err));
        });
      }
    </script>
  `;
}

/**
 * Student code input component
 */
export function createAttendanceCodeInput() {
  return `
    <section class="attendance-input" role="region" aria-labelledby="attendance-input-title">
      <h2 id="attendance-input-title" class="attendance-input__title">Mark Attendance</h2>
      <form 
        class="attendance-input__form"
        hx-post="/attendance/submit"
        hx-target="#attendance-result"
        hx-swap="innerHTML"
        hx-headers='{"Content-Type": "application/json"}'
        onsubmit="this.querySelector('#attendance-code').value = '';"
      >
        <label for="attendance-code" class="attendance-input__label">
          Enter Attendance Code:
        </label>
        <div class="attendance-input__group">
          <input 
            type="text" 
            id="attendance-code" 
            name="code" 
            class="attendance-input__field"
            placeholder="00000000"
            pattern="[0-9]{8}"
            maxlength="8"
            required
            aria-required="true"
            aria-label="8-digit attendance code"
          >
          <button 
            type="submit" 
            class="attendance-input__submit"
            aria-label="Submit attendance"
          >
            Submit
          </button>
        </div>
      </form>
      <div id="attendance-result" class="attendance-input__result" role="status" aria-live="polite"></div>
    </section>
  `;
}

/**
 * Display attendance submission result
 */
export function displayAttendanceResult(result) {
  if (result.success) {
    return `
      <div class="attendance-result attendance-result--success">
        <p class="attendance-result__message">
          ✓ Marked present for ${escapeHtml(result.courseName)} — ${escapeHtml(result.sessionName)}
        </p>
        <p class="attendance-result__time">
          Marked at: ${new Date(result.markedAt).toLocaleString()}
        </p>
      </div>
      <script>
        // Auto-refresh attendance list after successful submission
        (function() {
          setTimeout(() => {
            // Close any modals
            const modal = document.getElementById('attendance-modal');
            if (modal) {
              modal.remove();
            }
            
            // Refresh attendance history section using HTMX
            const historySection = document.getElementById('attendance-history-section');
            if (historySection && typeof htmx !== 'undefined') {
              htmx.ajax('GET', '/attendance/student/me', {
                target: '#attendance-history-section',
                swap: 'outerHTML'
              });
            } else if (typeof htmx !== 'undefined') {
              // If section doesn't exist yet, refresh the whole page content
              htmx.ajax('GET', '/attendance', {
                target: '#main-content',
                swap: 'outerHTML'
              });
            } else {
              // Fallback: reload the page if HTMX is not available
              window.location.reload();
            }
          }, 1000);
        })();
      </script>
    `;
  } else {
    return `
      <div class="attendance-result attendance-result--error">
        <p class="attendance-result__message">
          ${escapeHtml(result.error || "Failed to mark attendance")}
        </p>
      </div>
    `;
  }
}

/**
 * Display session attendance table (for professors)
 */
export function displaySessionAttendance(data) {
  const { sessionId, sessionName, polls, attendance } = data;
  
  const backButton = `
    <div class="attendance-table__header-actions">
      <button 
        class="btn btn--secondary"
        hx-get="/attendance"
        hx-target="#main-content"
        hx-swap="outerHTML"
        hx-push-url="true"
      >
        ← Back to Attendance
      </button>
    </div>
  `;

  if (!attendance || attendance.length === 0) {
    return `
      <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
        ${backButton}
        <h2 id="attendance-table-title" class="attendance-table__title">${escapeHtml(sessionName || "Session Attendance")}</h2>
        <p class="attendance-table__empty">No attendance records yet.</p>
      </section>
    `;
  }

  const rows = attendance.map((record) => `
    <tr class="attendance-table__row">
      <td class="attendance-table__cell">${escapeHtml(record.name)}</td>
      <td class="attendance-table__cell">${escapeHtml(record.email)}</td>
      <td class="attendance-table__cell">${new Date(record.markedAt).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
      ${backButton}
      <h2 id="attendance-table-title" class="attendance-table__title">${escapeHtml(sessionName || "Session Attendance")}</h2>
      <div class="attendance-table__container">
        <table class="attendance-table__table" role="table">
          <thead>
            <tr>
              <th class="attendance-table__header">Student Name</th>
              <th class="attendance-table__header">Email</th>
              <th class="attendance-table__header">Marked At</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Display course attendance summary (for professors)
 */
export function displayCourseAttendanceSummary(summary) {
  const { courseId, sessions, students } = summary;
  
  // Build session headers
  const sessionHeaders = sessions.map((s) => `
    <th class="attendance-summary__header">${escapeHtml(s.name)}</th>
  `).join("");

  // Build student rows
  const studentRows = students.map((student) => {
    const sessionCells = sessions.map((session) => {
      const record = student.sessions[session.id];
      const status = record?.present ? "✓" : "—";
      return `<td class="attendance-summary__cell">${status}</td>`;
    }).join("");
    
    return `
      <tr class="attendance-summary__row">
        <td class="attendance-summary__cell">${escapeHtml(student.name)}</td>
        <td class="attendance-summary__cell">${escapeHtml(student.email)}</td>
        ${sessionCells}
        <td class="attendance-summary__cell attendance-summary__cell--percentage">
          ${student.attendancePercentage}%
        </td>
      </tr>
    `;
  }).join("");

  return `
    <section class="attendance-summary" role="region" aria-labelledby="attendance-summary-title">
      <h2 id="attendance-summary-title" class="attendance-summary__title">Course Attendance Summary</h2>
      <div class="attendance-summary__container">
        <table class="attendance-summary__table" role="table">
          <thead>
            <tr>
              <th class="attendance-summary__header">Student</th>
              <th class="attendance-summary__header">Email</th>
              ${sessionHeaders}
              <th class="attendance-summary__header">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Display student's personal attendance history
 */
export function displayStudentAttendance(data) {
  const { studentId, attendance } = data;
  
  if (!attendance || attendance.length === 0) {
    return `
      <section class="attendance-history" role="region" aria-labelledby="attendance-history-title">
        <h2 id="attendance-history-title" class="attendance-history__title">My Attendance</h2>
        <p class="attendance-history__empty">No attendance records yet.</p>
      </section>
    `;
  }

  const records = attendance.map((record) => `
    <div class="attendance-history__record">
      <div class="attendance-history__course">${escapeHtml(record.courseName)}</div>
      <div class="attendance-history__session">${escapeHtml(record.sessionName)}</div>
      <div class="attendance-history__date">${new Date(record.date).toLocaleDateString()}</div>
      <div class="attendance-history__status attendance-history__status--present">Present</div>
      <div class="attendance-history__time">Marked at: ${new Date(record.markedAt).toLocaleString()}</div>
    </div>
  `).join("");

  return `
    <section class="attendance-history" role="region" aria-labelledby="attendance-history-title">
      <h2 id="attendance-history-title" class="attendance-history__title">My Attendance</h2>
      <div class="attendance-history__list">
        ${records}
      </div>
    </section>
  `;
}

/**
 * Display student's personal attendance history grouped by course (collapsible)
 */
export function displayStudentAttendanceGrouped(data) {
  const { studentId, courses } = data;
  
  if (!courses || courses.length === 0) {
    return `
      <section class="attendance-history" role="region" aria-labelledby="attendance-history-title" id="attendance-history-section">
        <h2 id="attendance-history-title" class="attendance-history__title">My Attendance</h2>
        <p class="attendance-history__empty">No attendance records yet.</p>
      </section>
    `;
  }

  const courseItems = courses.map((course, index) => {
    const courseId = `course-${course.courseId}`;
    const isExpanded = index === 0 ? "true" : "false"; // First course expanded by default
    
    const attendanceRows = course.attendances.map((attendance) => `
      <tr class="attendance-course-table__row">
        <td class="attendance-course-table__cell">${new Date(attendance.timestamp).toLocaleString()}</td>
        <td class="attendance-course-table__cell">${escapeHtml(attendance.sessionName)}</td>
        <td class="attendance-course-table__cell">
          <span class="attendance-course-table__status attendance-course-table__status--present">${escapeHtml(attendance.status)}</span>
        </td>
      </tr>
    `).join("");

    return `
      <div class="attendance-course-item">
        <button 
          class="attendance-course-item__header"
          type="button"
          aria-expanded="${isExpanded}"
          aria-controls="${courseId}-content"
          onclick="toggleCourseAttendance(this)"
        >
          <span class="attendance-course-item__name">${escapeHtml(course.courseName)}</span>
          <span class="attendance-course-item__count">${course.attendances.length} session${course.attendances.length !== 1 ? 's' : ''}</span>
          <span class="attendance-course-item__icon" aria-hidden="true">▼</span>
        </button>
        <div 
          class="attendance-course-item__content ${isExpanded ? 'attendance-course-item__content--expanded' : ''}"
          id="${courseId}-content"
          aria-hidden="${isExpanded ? 'false' : 'true'}"
        >
          <div class="attendance-course-table__container">
            <table class="attendance-course-table" role="table">
              <thead>
                <tr>
                  <th class="attendance-course-table__header">Date / Time</th>
                  <th class="attendance-course-table__header">Session Name</th>
                  <th class="attendance-course-table__header">Status</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="attendance-history" role="region" aria-labelledby="attendance-history-title" id="attendance-history-section">
      <h2 id="attendance-history-title" class="attendance-history__title">My Attendance</h2>
      <div class="attendance-history__courses">
        ${courseItems}
      </div>
    </section>
    <script>
      function toggleCourseAttendance(button) {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const contentId = button.getAttribute('aria-controls');
        const content = document.getElementById(contentId);
        const icon = button.querySelector('.attendance-course-item__icon');
        
        if (isExpanded) {
          button.setAttribute('aria-expanded', 'false');
          content.setAttribute('aria-hidden', 'true');
          content.classList.remove('attendance-course-item__content--expanded');
          icon.textContent = '▶';
        } else {
          button.setAttribute('aria-expanded', 'true');
          content.setAttribute('aria-hidden', 'false');
          content.classList.add('attendance-course-item__content--expanded');
          icon.textContent = '▼';
        }
      }
    </script>
  `;
}

/**
 * Start Attendance button component
 */
export function createStartAttendanceButton(sessionId) {
  return `
    <button 
      class="btn btn--primary"
      hx-get="/attendance/poll/form?sessionId=${sessionId}"
      hx-target="#attendance-modal-container"
      hx-swap="beforeend"
      aria-label="Start attendance for this session"
    >
      Start Attendance Poll
    </button>
  `;
}

/**
 * Create a modal form to create a new course session
 */
export function createSessionForm(classId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return `
    <section id="session-modal" class="attendance-modal__overlay">
      <div class="attendance-modal">
        <h2>Create New Session</h2>
        <div id="session-modal-error" class="alert alert--error" style="display: none; margin-bottom: 1rem;"></div>
        <form 
          id="create-session-form"
          hx-post="/course-sessions" 
          hx-target="#main-content"
          hx-swap="innerHTML"
          hx-push-url="true"
          hx-on::before-request="
            // Close modal immediately on form submission start
            const modal = document.getElementById('session-modal');
            if(modal) {
              // Store that we're submitting so we don't reopen on error
              modal.setAttribute('data-submitting', 'true');
            }
          "
          hx-on::before-swap="
            const status = event.detail.xhr.status;
            const modal = document.getElementById('session-modal');
            
            // Handle validation errors - show error, keep modal open
            if(status === 400) {
              if(modal) modal.removeAttribute('data-submitting');
              event.detail.shouldSwap = false;
              const errorDiv = document.getElementById('session-modal-error');
              if(errorDiv) {
                errorDiv.innerHTML = event.detail.xhr.responseText;
                errorDiv.style.display = 'block';
              }
              return false;
            }
            
            // On success (200, 201) - close modal immediately before swap
            if(status === 200 || status === 201) {
              if(modal) {
                modal.style.transition = 'opacity 0.15s ease-out';
                modal.style.opacity = '0';
                setTimeout(function() {
                  if(modal && modal.parentNode) {
                    modal.remove();
                  }
                }, 150);
              }
            }
          "
          hx-on::after-request="
            // Close modal immediately on successful response
            const status = event.detail.xhr.status;
            if(status === 200 || status === 201) {
              const modal = document.getElementById('session-modal');
              if(modal) {
                modal.style.transition = 'opacity 0.15s ease-out';
                modal.style.opacity = '0';
                setTimeout(function() {
                  if(modal && modal.parentNode) {
                    modal.remove();
                  }
                }, 150);
              }
            }
          "
        >
          <input type="hidden" name="classId" value="${classId}">
          
          <label class="attendance-modal__label">
            Session Name:
            <input 
              type="text" 
              name="name" 
              class="attendance-modal__input" 
              placeholder="e.g., Lecture 1, Lab Session 2"
              required
            >
          </label>
          
          <label class="attendance-modal__label">
            Date:
            <input 
              type="date" 
              name="date" 
              class="attendance-modal__input" 
              value="${today}"
              required
            >
          </label>
          
          <label class="attendance-modal__label">
            Start Time (optional):
            <input 
              type="time" 
              name="startTime" 
              class="attendance-modal__input"
            >
          </label>
          
          <label class="attendance-modal__label">
            End Time (optional):
            <input 
              type="time" 
              name="endTime" 
              class="attendance-modal__input"
            >
          </label>
          
          <div class="attendance-modal__actions">
            <button type="submit" class="attendance-modal__button attendance-modal__button--primary">
              Create Session
            </button>
            <button 
              type="button" 
              class="attendance-modal__button attendance-modal__button--secondary"
              hx-on:click="
                event.preventDefault();
                event.stopPropagation();
                const modal = document.getElementById('session-modal');
                if(modal) {
                  modal.style.transition = 'opacity 0.15s ease-out';
                  modal.style.opacity = '0';
                  setTimeout(function() {
                    if(modal && modal.parentNode) {
                      modal.remove();
                    }
                  }, 150);
                }
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  `;
}

/**
 * Create button to open session creation form
 */
export function createSessionButton(classId) {
  return `
    <button 
      class="btn btn--primary"
      hx-get="/course-sessions/form?classId=${classId}"
      hx-target="#attendance-modal-container"
      hx-swap="beforeend"
      aria-label="Create a new session for this class"
    >
      Create Session
    </button>
  `;
}

/**
 * Check if a poll is expired
 */
function isPollExpired(poll) {
  if (!poll || !poll.expiresAt) {
    return true;
  }
  const now = new Date();
  const expiresAt = new Date(poll.expiresAt);
  return now >= expiresAt;
}

/**
 * Get code status (active/expired)
 */
function getCodeStatus(poll) {
  if (!poll) {
    return { status: "none", text: "—" };
  }
  if (isPollExpired(poll)) {
    return { status: "expired", text: "Expired" };
  }
  return { status: "active", text: "Active" };
}

/**
 * Format time for display
 */
function formatSessionTime(session) {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString();
  
  if (session.startTime) {
    const time = new Date(session.startTime);
    const timeStr = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} at ${timeStr}`;
  }
  return dateStr;
}

/**
 * Display professor attendance page with course-based organization
 */
export function displayProfessorAttendancePage(data) {
  const { classes } = data;
  
  const coursePanes = classes.map((klass, courseIndex) => {
    const isExpanded = courseIndex === 0;
    return displayCourseItem({
      course: klass,
      sessions: klass.sessions,
      isExpanded,
    });
  }).join("");
  
  return `
    <div class="container">
      <section class="attendance-page" role="region" aria-labelledby="attendance-page-title">
        <div class="attendance-page__header">
          <h2 id="attendance-page-title" class="attendance-page__title">Attendance</h2>
        </div>
        <div class="attendance-courses">
          ${coursePanes}
        </div>
        <div id="attendance-modal-container"></div>
      </section>
    </div>
  `;
}

/**
 * Get code status fragment for HTMX polling
 */
export function getCodeStatusFragment(poll) {
  const codeStatus = getCodeStatus(poll);
  if (!poll) {
    return `<span class="attendance-code-status">—</span>`;
  }
  return `
    <span class="attendance-code-status attendance-code-status--${codeStatus.status}">
      ${escapeHtml(codeStatus.text)}
    </span>
  `;
}

/**
 * Display session-wise attendance records page
 */
export function displaySessionRecordsPage(data) {
  const { sessionId, sessionName, courseName, courseId, attendance } = data;

  if (!attendance || attendance.length === 0) {
    return `
      <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
        <h2 id="attendance-table-title" class="attendance-table__title">${escapeHtml(sessionName || "Session Attendance")}</h2>
        <p class="attendance-table__empty">No attendance records yet.</p>
      </section>
    `;
  }

  const rows = attendance.map((record) => `
    <tr class="attendance-table__row">
      <td class="attendance-table__cell">${escapeHtml(record.name)}</td>
      <td class="attendance-table__cell">${escapeHtml(record.email)}</td>
      <td class="attendance-table__cell">${new Date(record.markedAt).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
      <h2 id="attendance-table-title" class="attendance-table__title">${escapeHtml(sessionName || "Session Attendance")}</h2>
      <p class="attendance-table__subtitle">Course: ${escapeHtml(courseName)}</p>
      <div class="attendance-table__container">
        <table class="attendance-table__table" role="table">
          <thead>
            <tr>
              <th class="attendance-table__header">Student Name</th>
              <th class="attendance-table__header">Email</th>
              <th class="attendance-table__header">Marked At</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Display course-wise attendance records page
 * Pivoted table: students as rows, sessions as columns
 */
export function displayCourseRecordsPage(data) {
  const { courseId, courseName, sessions, students } = data;

  if (!sessions || sessions.length === 0) {
    return `
      <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
        <h2 id="attendance-table-title" class="attendance-table__title">Course Attendance Records</h2>
        <p class="attendance-table__subtitle">Course: ${escapeHtml(courseName)}</p>
        <p class="attendance-table__empty">No sessions yet.</p>
      </section>
    `;
  }

  if (!students || students.length === 0) {
    return `
      <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
        <h2 id="attendance-table-title" class="attendance-table__title">Course Attendance Records</h2>
        <p class="attendance-table__subtitle">Course: ${escapeHtml(courseName)}</p>
        <p class="attendance-table__empty">No enrolled students yet.</p>
      </section>
    `;
  }

  // Build session header columns
  const sessionHeaders = sessions.map((session) => `
    <th class="attendance-table__header">${escapeHtml(session.name)}</th>
  `).join("");

  // Build student rows with attendance status for each session
  const studentRows = students.map((student) => {
    // Calculate attendance percentage
    const totalSessions = sessions.length;
    let attendedSessions = 0;
    
    // Build cells for each session and count attendance
    const sessionCells = sessions.map((session) => {
      const attendance = student.sessionAttendance[session.id];
      if (attendance && attendance.present) {
        attendedSessions++;
        return `
          <td class="attendance-table__cell attendance-table__cell--present">
            ✓
          </td>
        `;
      } else {
        return `
          <td class="attendance-table__cell attendance-table__cell--absent">
            —
          </td>
        `;
      }
    }).join("");

    // Calculate percentage
    const attendancePercentage = totalSessions > 0 
      ? Math.round((attendedSessions / totalSessions) * 100)
      : 0;

    return `
      <tr class="attendance-table__row">
        <td class="attendance-table__cell attendance-table__cell--student-name">
          ${escapeHtml(student.name)}
        </td>
        ${sessionCells}
        <td class="attendance-table__cell attendance-table__cell--percentage">
          ${attendancePercentage}%
        </td>
      </tr>
    `;
  }).join("");

  return `
    <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
      <h2 id="attendance-table-title" class="attendance-table__title">Course Attendance Records</h2>
      <p class="attendance-table__subtitle">Course: ${escapeHtml(courseName)}</p>
      <div class="attendance-table__container">
        <table class="attendance-table__table" role="table">
          <thead>
            <tr>
              <th class="attendance-table__header">Student Name</th>
              ${sessionHeaders}
              <th class="attendance-table__header">Total %</th>
            </tr>
          </thead>
          <tbody>
            ${studentRows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Display course item (for toggling - includes button and content)
 */
export function displayCourseItem(data) {
  const { course, sessions, isExpanded } = data;
  const courseId = `course-${course.id}`;
  
  // Build table rows for sessions
  const sessionRows = sessions.map((session) => {
    const latestPoll = session.attendancePolls && session.attendancePolls.length > 0 
      ? session.attendancePolls[0] 
      : null;
    const codeStatus = getCodeStatus(latestPoll);
    const hasCode = latestPoll !== null;
    
    // Determine action button
    let actionButton;
    if (hasCode) {
      actionButton = `
        <button 
          class="btn btn--primary btn--small"
          hx-get="/attendance/course/session/${session.id}/records"
          hx-target="#main-content"
          hx-swap="outerHTML"
          hx-push-url="true"
        >
          View Records
        </button>
      `;
    } else {
      actionButton = `
        <button 
          class="btn btn--primary btn--small"
          hx-get="/attendance/poll/form?sessionId=${session.id}"
          hx-target="#attendance-modal-container"
          hx-swap="beforeend"
        >
          Generate Code
        </button>
      `;
    }
    
      // Code status cell (no auto-refresh)
      const statusCell = hasCode ? `
        <td class="attendance-sessions-table__cell">
          <span class="attendance-code-status attendance-code-status--${codeStatus.status}">
            ${escapeHtml(codeStatus.text)}
          </span>
        </td>
      ` : `
        <td class="attendance-sessions-table__cell">—</td>
      `;
    
    return `
      <tr class="attendance-sessions-table__row">
        <td class="attendance-sessions-table__cell">${escapeHtml(session.name)}</td>
        <td class="attendance-sessions-table__cell">${formatSessionTime(session)}</td>
        <td class="attendance-sessions-table__cell">
          ${hasCode ? escapeHtml(latestPoll.code) : "—"}
        </td>
        ${statusCell}
        <td class="attendance-sessions-table__cell attendance-sessions-table__cell--actions">
          ${actionButton}
        </td>
      </tr>
    `;
  }).join("");
  
  const sessionsTable = sessions.length > 0 ? `
    <div class="attendance-sessions-table__container">
      <table class="attendance-sessions-table" role="table">
        <thead>
          <tr>
            <th class="attendance-sessions-table__header">Session Name</th>
            <th class="attendance-sessions-table__header">Time</th>
            <th class="attendance-sessions-table__header">Attendance Code</th>
            <th class="attendance-sessions-table__header">Code Status</th>
            <th class="attendance-sessions-table__header">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sessionRows}
        </tbody>
      </table>
    </div>
  ` : `
    <div class="attendance-course-item__empty">
      <p>No sessions yet. Create a session to start taking attendance.</p>
    </div>
  `;
  
  return `
    <div class="attendance-course-item" id="course-item-${course.id}">
      <button 
        class="attendance-course-item__header"
        type="button"
        aria-expanded="${isExpanded ? "true" : "false"}"
        aria-controls="${courseId}-content"
        hx-get="/attendance/course/${course.id}/toggle?expanded=${isExpanded ? "true" : "false"}"
        hx-target="#course-item-${course.id}"
        hx-swap="outerHTML"
      >
        <span class="attendance-course-item__name">${escapeHtml(course.name)}</span>
        <span class="attendance-course-item__count">${sessions.length} session${sessions.length !== 1 ? 's' : ''}</span>
        <span class="attendance-course-item__icon" aria-hidden="true">${isExpanded ? "▼" : "▶"}</span>
      </button>
      <div 
        class="attendance-course-item__content ${isExpanded ? "attendance-course-item__content--expanded" : ""}"
        id="${courseId}-content"
        aria-hidden="${!isExpanded ? "true" : "false"}"
      >
        ${sessionsTable}
        <div class="attendance-course-item__actions">
          ${createSessionButton(course.id)}
        <button 
          class="btn btn--secondary"
          hx-get="/attendance/course/${course.id}/records"
          hx-target="#main-content"
          hx-swap="outerHTML"
          hx-push-url="true"
          aria-label="View attendance for all sessions in this course"
        >
          View Attendance
        </button>
        </div>
      </div>
    </div>
  `;
}
