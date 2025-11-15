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
          hx-post="/api/attendance/poll/create" 
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
              hx-get="/api/attendance/close-modal" 
              hx-target="#attendance-modal" 
              hx-swap="outerHTML"
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
            hx-get="/api/attendance/close-modal" 
            hx-target="#attendance-modal" 
            hx-swap="outerHTML"
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
        hx-post="/api/attendance/submit"
        hx-target="#attendance-result"
        hx-swap="innerHTML"
        hx-headers='{"Content-Type": "application/json"}'
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
  const { sessionId, polls, attendance } = data;
  
  if (!attendance || attendance.length === 0) {
    return `
      <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
        <h2 id="attendance-table-title" class="attendance-table__title">Session Attendance</h2>
        <p class="attendance-table__empty">No attendance records yet.</p>
      </section>
    `;
  }

  const rows = attendance.map((record) => `
    <tr class="attendance-table__row">
      <td class="attendance-table__cell">${escapeHtml(record.name)}</td>
      <td class="attendance-table__cell">${escapeHtml(record.email)}</td>
      <td class="attendance-table__cell">${new Date(record.markedAt).toLocaleString()}</td>
      <td class="attendance-table__cell">${record.pollCode || "N/A"}</td>
    </tr>
  `).join("");

  return `
    <section class="attendance-table" role="region" aria-labelledby="attendance-table-title">
      <h2 id="attendance-table-title" class="attendance-table__title">Session Attendance</h2>
      <div class="attendance-table__container">
        <table class="attendance-table__table" role="table">
          <thead>
            <tr>
              <th class="attendance-table__header">Student Name</th>
              <th class="attendance-table__header">Email</th>
              <th class="attendance-table__header">Marked At</th>
              <th class="attendance-table__header">Poll Code</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <button 
        class="attendance-table__export"
        hx-get="/api/attendance/session/${sessionId}/export"
        hx-target="body"
      >
        Export CSV
      </button>
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
 * Start Attendance button component
 */
export function createStartAttendanceButton(sessionId) {
  return `
    <button 
      class="btn btn--primary"
      hx-get="/api/attendance/poll/form?sessionId=${sessionId}"
      hx-target="#attendance-modal-container"
      hx-swap="beforeend"
      aria-label="Start attendance for this session"
    >
      Start Attendance Poll
    </button>
  `;
}

/**
 * Close modal (empty response)
 */
export function closeAttendanceModal() {
  return "";
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
        <form 
          hx-post="/api/course-sessions" 
          hx-target="#main-content" 
          hx-swap="outerHTML"
          hx-push-url="true"
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
              hx-get="/api/attendance/close-modal" 
              hx-target="#session-modal" 
              hx-swap="outerHTML"
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
      hx-get="/api/course-sessions/form?classId=${classId}"
      hx-target="#attendance-modal-container"
      hx-swap="beforeend"
      aria-label="Create a new session for this class"
    >
      Create Session
    </button>
  `;
}

