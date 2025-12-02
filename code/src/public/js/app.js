/**
 * Monkey School - App Interaction
 * Handles global UI interactions (Sidebar, Modals, Toasts)
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🐒 Monkey School UI Loaded");

  // === TOAST SYSTEM ===
  window.showToast = (title, message, type = "info") => {
    const container = document.getElementById("toast-container");
    if (!container) {
      // Create container if missing
      const newContainer = document.createElement("div");
      newContainer.id = "toast-container";
      newContainer.className = "toast-container";
      document.body.appendChild(newContainer);
      return window.showToast(title, message, type);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-info";
    if (type === "success") iconClass = "fa-check";
    if (type === "error") iconClass = "fa-exclamation";

    toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-times"></i>
            </div>
        `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.classList.add("hiding");
      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, 4000);
  };

  // === MODAL SYSTEM ===
  window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
    }
  };

  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
    }
  };

  // Close modal on outside click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
      }
    });
  });

  // === HTMX Event Listeners ===
  // Show toast on HTMX error
  document.body.addEventListener("htmx:responseError", (evt) => {
    const errorMsg =
      evt.detail.xhr.responseText || "An unexpected error occurred";
    window.showToast("Error", errorMsg, "error");
  });

  // Handle HTMX redirects if needed manually (usually HX-Redirect handles it)
});

// === COURSE SESSION CREATION ===
/**
 * Open the create session modal with a specific classId
 * @param {string} classId - The class ID to associate the session with
 */
window.openCreateSessionModal = (classId) => {
  const modal = document.getElementById("modal-create-session");
  const classIdInput = document.getElementById("session-class-id");
  
  if (modal && classIdInput) {
    classIdInput.value = classId;
    // Reset form
    const form = document.getElementById("create-session-form");
    if (form) {
      form.reset();
      classIdInput.value = classId; // Reset clears the value, so set it again
    }
    // Clear any previous errors
    const errorDiv = document.getElementById("session-form-error");
    if (errorDiv) {
      errorDiv.style.display = "none";
      errorDiv.textContent = "";
    }
    modal.classList.add("open");
    
    // Initialize form validations
    initializeSessionForm();
  }
};

/**
 * Handle form submission for creating a new course session
 * @param {Event} event - The form submit event
 */
window.handleCreateSession = async (event) => {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = document.getElementById("session-submit-btn");
  const errorDiv = document.getElementById("session-form-error");
  
  // Get form values
  const classId = document.getElementById("session-class-id").value;
  const name = document.getElementById("session-name").value.trim();
  const date = document.getElementById("session-date").value;
  const startTime = document.getElementById("session-start-time").value;
  const endTime = document.getElementById("session-end-time").value;
  
  // Clear previous errors
  if (errorDiv) {
    errorDiv.style.display = "none";
    errorDiv.textContent = "";
  }
  
  // Validation
  if (!name) {
    showError("Session name is required");
    return;
  }
  
  if (!date) {
    showError("Date is required");
    return;
  }
  
  // Validate end time is after start time
  if (startTime && endTime && endTime <= startTime) {
    showError("End time must be after start time");
    return;
  }
  
  // Convert date and time to proper format
  // The backend expects:
  // - date: YYYY-MM-DD string
  // - startTime/endTime: ISO datetime strings OR HH:MM format (backend will combine with date)
  
  // For simplicity and to avoid timezone issues, we'll send:
  // - date: YYYY-MM-DD (as-is from input)
  // - startTime/endTime: ISO datetime strings constructed from date + time
  
  let dateISO = date; // Already in YYYY-MM-DD format
  let startTimeISO = null;
  let endTimeISO = null;
  
  try {
    // Combine date with time if provided
    // Create ISO string: YYYY-MM-DDTHH:MM:00 (in local time, no timezone)
    // The backend will parse this correctly
    if (startTime) {
      // Format: YYYY-MM-DDTHH:MM:00
      startTimeISO = `${date}T${startTime}:00`;
    }
    
    if (endTime) {
      // Format: YYYY-MM-DDTHH:MM:00
      endTimeISO = `${date}T${endTime}:00`;
    }
  } catch (error) {
    showError("Invalid date or time format");
    return;
  }
  
  // Prepare request body
  const body = {
    classId: classId,
    name: name,
    date: dateISO,
  };
  
  if (startTimeISO) {
    body.startTime = startTimeISO;
  }
  
  if (endTimeISO) {
    body.endTime = endTimeISO;
  }
  
  // Disable submit button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";
  }
  
  try {
    // Make API call
    const response = await fetch("/course-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle error response
      const errorMessage = data.error || data.details || "Failed to create session";
      showError(errorMessage);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create";
      }
      return;
    }
    
    // Success - close modal and update table
    closeModal("modal-create-session");
    showToast("Success", "Session created successfully!", "success");
    
    // Add new session to the table
    addSessionToTable(data, classId);
    
  } catch (error) {
    console.error("Error creating session:", error);
    showError("Network error. Please try again.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create";
    }
  }
};

/**
 * Show error message in the form
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorDiv = document.getElementById("session-form-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

/**
 * Initialize session form validations (date and time)
 */
function initializeSessionForm() {
  const dateInput = document.getElementById("session-date");
  const startTimeInput = document.getElementById("session-start-time");
  const endTimeInput = document.getElementById("session-end-time");
  
  if (!dateInput) return;
  
  // Disable past dates based on PST timezone
  const pstDate = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const today = new Date(pstDate);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = yyyy + "-" + mm + "-" + dd;
  
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
  
  // Add event listeners for time validation (only if not already added)
  if (startTimeInput && !startTimeInput.dataset.validationAdded) {
    startTimeInput.addEventListener("change", validateSessionTimes);
    startTimeInput.addEventListener("input", validateSessionTimes);
    startTimeInput.dataset.validationAdded = "true";
  }
  
  if (endTimeInput && !endTimeInput.dataset.validationAdded) {
    endTimeInput.addEventListener("change", validateSessionTimes);
    endTimeInput.addEventListener("input", validateSessionTimes);
    endTimeInput.dataset.validationAdded = "true";
  }
}

/**
 * Add a new session row to the appropriate table
 * @param {Object} session - The created session object
 * @param {string} classId - The class ID to find the correct table
 */
function addSessionToTable(session, classId) {
  // Find the course card that matches this classId
  // The classId in the course object might be stored differently
  // We need to find the table that belongs to this class
  
  // Try to find the table by looking for the course card
  // The course.id is classId without dashes, so we need to match
  const courseIdWithoutDashes = classId.replace(/-/g, "");
  
  // Find the course content div
  const courseContent = document.getElementById(`content-${courseIdWithoutDashes}`);
  if (!courseContent) {
    // If we can't find it, refresh the page or reload the attendance section
    // For now, we'll just show a success message
    return;
  }
  
  // Check if there's already a table or empty state
  const existingTable = courseContent.querySelector(".data-table");
  const emptyState = courseContent.querySelector("div[style*='text-align: center']");
  
  // Format session data for display
  const sessionDate = new Date(session.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const sessionTime = session.startTime
    ? new Date(session.startTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "10:00 AM";
  
  const sessionCode = "---- ----"; // New sessions don't have codes yet
  const sessionStatus = "expired"; // New sessions are not active
  const sessionId = session.id;
  
  // Create table row HTML with proper dropdown structure
  const rowHTML = `
    <tr id="session-row-${escapeHtml(sessionId)}">
      <td><strong>${escapeHtml(session.name)}</strong></td>
      <td>${escapeHtml(sessionDate)} • ${escapeHtml(sessionTime)}</td>
      <td class="font-mono">${escapeHtml(sessionCode)}</td>
      <td><span class="status-pill status-expired">Expired</span></td>
      <td class="actions-cell">
        <div class="dropdown-container">
          <button class="btn-icon dropdown-toggle" type="button" onclick="toggleDropdown(event, 'dropdown-${escapeHtml(sessionId)}')">
            <i class="fa-solid fa-ellipsis-v"></i>
          </button>
          <div class="dropdown-menu" id="dropdown-${escapeHtml(sessionId)}">
            <a class="dropdown-item" 
               hx-get="/course/${escapeHtml(classId)}/session/${escapeHtml(sessionId)}/poll/new"
               hx-target="#dialog"
               hx-swap="innerHTML"
               hx-trigger="click"
               onclick="event.stopPropagation(); toggleDropdown(event, 'dropdown-${escapeHtml(sessionId)}');">
              <i class="fa-solid fa-play"></i> Start Poll
            </a>
            <a class="dropdown-item" 
               href="/course/${escapeHtml(classId)}/session/${escapeHtml(sessionId)}/records"
               hx-get="/course/${escapeHtml(classId)}/session/${escapeHtml(sessionId)}/records"
               hx-target="#main-content"
               hx-swap="innerHTML"
               hx-push-url="true"
               onclick="event.stopPropagation(); toggleDropdown(event, 'dropdown-${escapeHtml(sessionId)}');">
              <i class="fa-solid fa-list"></i> View Records
            </a>
          </div>
        </div>
      </td>
    </tr>
  `;
  
  if (existingTable) {
    // Add row to existing table
    const tbody = existingTable.querySelector("tbody");
    if (tbody) {
      tbody.insertAdjacentHTML("afterbegin", rowHTML);
      // Initialize dropdowns and actions after adding the row
      setTimeout(() => {
        if (window.initializeSessionDropdowns) {
          window.initializeSessionDropdowns();
        }
        if (window.initializeSessionActions) {
          window.initializeSessionActions();
        }
      }, 50);
    }
  } else if (emptyState) {
    // Replace empty state with table
    const tableHTML = `
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
          ${rowHTML}
        </tbody>
      </table>
    `;
    emptyState.outerHTML = tableHTML;
    // Initialize dropdowns and actions after creating table
    setTimeout(() => {
      if (window.initializeSessionDropdowns) {
        window.initializeSessionDropdowns();
      }
      if (window.initializeSessionActions) {
        window.initializeSessionActions();
      }
    }, 50);
  } else {
    // Create new table
    const tableHTML = `
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
          ${rowHTML}
        </tbody>
      </table>
    `;
    courseContent.innerHTML = tableHTML;
    // Initialize dropdowns and actions after creating table
    setTimeout(() => {
      if (window.initializeSessionDropdowns) {
        window.initializeSessionDropdowns();
      }
      if (window.initializeSessionActions) {
        window.initializeSessionActions();
      }
    }, 50);
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}