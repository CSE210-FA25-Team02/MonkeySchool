/**
 * Schedule Calendar Templates
 * code/src/utils/htmx-templates/schedule-templates.js
 *
 * Schedule calendar with real database events.
 * Supports week view and day view.
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Map database EventType enum to display label
 * Note: We now use DB enum values directly in the UI
 *
 * @param {string} dbType - Database event type (COURSE_LECTURE, COURSE_OFFICE_HOUR, etc.)
 * @returns {string} Display label for the event type
 */
function getEventTypeLabel(dbType) {
  const typeLabels = {
    COURSE_LECTURE: "Lecture",
    COURSE_OFFICE_HOUR: "Office Hours",
    COURSE_DISCUSSION: "Discussion",
    GROUP_MEETING: "Group Meeting",
    OTHER: "Other",
  };
  return typeLabels[dbType] || "Other";
}

/**
 * Transform database event to UI event format
 * Note: We now use DB enum values directly (COURSE_LECTURE, etc.)
 *
 * @param {Object} dbEvent - Database event object
 * @returns {Object} UI event object
 */
function transformDbEventToUI(dbEvent) {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    start: new Date(dbEvent.startTime),
    end: new Date(dbEvent.endTime),
    type: dbEvent.type, // Use DB enum value directly
    location: dbEvent.location || "",
  };
}

/**
 * Format time for display in the calendar.
 *
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get CSS class name for a given event type.
 * Uses DB enum values (COURSE_LECTURE, etc.)
 *
 * @param {string} type - Event type identifier (DB enum value)
 * @returns {string} CSS class name
 */
function getEventTypeClass(type) {
  const map = {
    COURSE_OFFICE_HOUR: "schedule-event--office-hours",
    COURSE_LECTURE: "schedule-event--lecture",
    COURSE_DISCUSSION: "schedule-event--lecture", // Use same style as lecture
    GROUP_MEETING: "schedule-event--meeting",
    OTHER: "schedule-event--default",
    default: "schedule-event--default",
  };
  return map[type] || map.default;
}

/**
 * Get Font Awesome icon class for a given event type.
 * Uses DB enum values (COURSE_LECTURE, etc.)
 *
 * @param {string} type - Event type identifier (DB enum value)
 * @returns {string} Icon class name
 */
function getEventTypeIcon(type) {
  const map = {
    COURSE_OFFICE_HOUR: "fa-clock",
    COURSE_LECTURE: "fa-chalkboard",
    COURSE_DISCUSSION: "fa-comments", // Discussion icon
    GROUP_MEETING: "fa-users",
    OTHER: "fa-circle",
    default: "fa-circle",
  };
  return map[type] || map.default;
}

/**
 * Render schedule calendar page
 * @param {Object} classInfo - Class information
 * @param {string} view - 'week' or 'day'
 * @param {Date} currentDate - Current date for the view
 * @param {Array} dbEvents - Array of database event objects
 * @param {Array<string>} [allowedEventTypes=[]] - Array of allowed event type values for the current user
 * @param {Object} [groupsData={}] - Groups data for the modal (allGroups, isGroupLeader, leaderGroupId)
 * @returns {string} HTML string
 */
export function renderSchedulePage(
  classInfo,
  view = "week",
  currentDate = new Date(),
  dbEvents = [],
  allowedEventTypes = [],
  groupsData = {},
) {
  const classId = classInfo.id;
  const className = escapeHtml(classInfo.name);
  const classQuarter = escapeHtml(classInfo.quarter || "Current");

  // Calculate week start (Monday)
  const weekStart = new Date(currentDate);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);

  // Transform database events to UI format and sort by startTime
  const allEvents = dbEvents
    .map(transformDbEventToUI)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Filter events based on view
  let displayEvents = allEvents;
  let displayDate = weekStart;

  if (view === "day") {
    displayDate = new Date(currentDate);
    displayDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(displayDate);
    dayEnd.setHours(23, 59, 59, 999);
    displayEvents = allEvents.filter(
      (e) => e.start >= displayDate && e.start <= dayEnd,
    );
  }

  // Format dates for display
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayAbbr = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Get week dates - use actual day of week from date object
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const actualDayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekDates.push({
      date,
      dayName: days[actualDayOfWeek], // Use actual day of week from date
      dayAbbr: dayAbbr[actualDayOfWeek],
      dayNum: date.getDate(),
      isToday: date.toDateString() === new Date().toDateString(),
    });
  }

  // Group events by day
  const eventsByDay = {};
  weekDates.forEach((day) => {
    eventsByDay[day.dayName] = allEvents.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === day.date.toDateString();
    });
  });

  // Navigation helpers
  const prevDate = new Date(displayDate);
  prevDate.setDate(displayDate.getDate() - (view === "week" ? 7 : 1));

  const nextDate = new Date(displayDate);
  nextDate.setDate(displayDate.getDate() + (view === "week" ? 7 : 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Render week view
  const weekViewHTML = `
    <div class="schedule-week-grid">
      ${weekDates
        .map((day) => {
          const dayEvents = eventsByDay[day.dayName] || [];
          return `
            <div class="schedule-day-column ${day.isToday ? "schedule-day-column--today" : ""}">
              <div class="schedule-day-header">
                <div class="schedule-day-name">${day.dayAbbr}</div>
                <div class="schedule-day-number ${day.isToday ? "schedule-day-number--today" : ""}">${day.dayNum}</div>
                ${dayEvents.length > 0 ? `<div class="schedule-day-count">${dayEvents.length} events</div>` : '<div class="schedule-day-count">No events</div>'}
              </div>
              <div class="schedule-day-events">
                ${dayEvents
                  .map((event) => {
                    const startTime = formatTime(event.start);
                    const endTime = formatTime(event.end);
                    return `
                      <div class="schedule-event ${getEventTypeClass(event.type)}" data-event-id="${event.id}" onclick="openEventModal('${event.id}')" style="cursor: pointer;">
                        <div class="schedule-event__icon">
                          <i class="fa-solid ${getEventTypeIcon(event.type)}"></i>
                        </div>
                        <div class="schedule-event__content">
                          <div class="schedule-event__title">${escapeHtml(event.title)}</div>
                          <div class="schedule-event__time">
                            <i class="fa-regular fa-clock"></i> ${startTime} - ${endTime}
                          </div>
                          ${
                            event.location
                              ? `
                            <div class="schedule-event__location">
                              <i class="fa-solid fa-location-dot"></i> ${escapeHtml(event.location)}
                            </div>
                          `
                              : ""
                          }
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  // Render day view
  const dayViewHTML = `
    <div class="schedule-day-view">
      <div class="schedule-day-header-large">
        <div class="schedule-day-name-large">${days[displayDate.getDay()]}</div>
        <div class="schedule-day-date-large">${displayDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
      </div>
      <div class="schedule-day-events-list">
        ${
          displayEvents.length > 0
            ? displayEvents
                .map((event) => {
                  const startTime = formatTime(event.start);
                  const endTime = formatTime(event.end);
                  return `
                  <div class="schedule-event ${getEventTypeClass(event.type)}" data-event-id="${event.id}" onclick="openEventModal('${event.id}')" style="cursor: pointer;">
                    <div class="schedule-event__icon">
                      <i class="fa-solid ${getEventTypeIcon(event.type)}"></i>
                    </div>
                    <div class="schedule-event__content">
                      <div class="schedule-event__title">${escapeHtml(event.title)}</div>
                      <div class="schedule-event__time">
                        <i class="fa-regular fa-clock"></i> ${startTime} - ${endTime}
                      </div>
                      ${
                        event.location
                          ? `
                        <div class="schedule-event__location">
                          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(event.location)}
                        </div>
                      `
                          : ""
                      }
                    </div>
                  </div>
                `;
                })
                .join("")
            : '<div class="schedule-empty-state">No events scheduled for this day.</div>'
        }
      </div>
    </div>
  `;

  return `
    <!-- Class Header -->
    <div class="schedule-class-header">
      <div class="schedule-class-info">
        <h1 class="schedule-class-title">${className} - Calendar</h1>
        <div class="schedule-class-meta">
          <span class="schedule-class-quarter">${classQuarter}</span>
        </div>
      </div>
      <button 
        type="button"
        class="btn btn--primary"
        onclick="openModal('modal-create-event')"
      >
        <i class="fa-solid fa-plus"></i> Create Event
      </button>
    </div>

    <!-- Calendar Controls -->
    <div class="schedule-controls">
      <div class="schedule-view-toggle">
        <button 
          type="button"
          class="schedule-view-btn ${view === "week" ? "schedule-view-btn--active" : ""}"
          onclick="switchScheduleView('week', '${displayDate.toISOString()}')"
        >
          Week
        </button>
        <button 
          type="button"
          class="schedule-view-btn ${view === "day" ? "schedule-view-btn--active" : ""}"
          onclick="switchScheduleView('day', '${displayDate.toISOString()}')"
        >
          Day
        </button>
      </div>
      <div class="schedule-navigation">
        <button 
          type="button"
          class="schedule-nav-btn"
          onclick="navigateSchedule('${view}', '${prevDate.toISOString()}')"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          type="button"
          class="schedule-nav-btn schedule-nav-btn--today"
          onclick="navigateSchedule('${view}', '${today.toISOString()}')"
        >
          Today
        </button>
        <button 
          type="button"
          class="schedule-nav-btn"
          onclick="navigateSchedule('${view}', '${nextDate.toISOString()}')"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Calendar Content -->
    <div class="schedule-content">
      ${view === "week" ? weekViewHTML : dayViewHTML}
    </div>

    <!-- Create Event Modal -->
    ${renderCreateEventModal(classId, null, allowedEventTypes, groupsData)}
    
    <!-- Event Detail Modal (loaded via HTMX) -->
    <div id="modal-event-detail" class="modal-overlay">
      <div id="event-detail-content" class="modal-card">
        <!-- Content loaded via HTMX -->
      </div>
    </div>
    
    <script>
      // Open event detail modal via HTMX
      window.openEventModal = function(eventId) {
        const modal = document.getElementById('modal-event-detail');
        const content = document.getElementById('event-detail-content');
        if (modal && content) {
          // Show loading state
          content.innerHTML = '<div style="padding: var(--space-4); text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';
          modal.classList.add('open');
          
          // Use HTMX to fetch event details
          if (typeof htmx !== 'undefined') {
            htmx.ajax('GET', '/events/' + eventId, {
              target: '#event-detail-content',
              swap: 'outerHTML',
            }).then(() => {
              // Ensure modal is open and restore the content id
              const modalAfter = document.getElementById('modal-event-detail');
              const contentAfter = document.querySelector('#modal-event-detail .modal-card');
              if (modalAfter) {
                modalAfter.classList.add('open');
              }
              if (contentAfter && !contentAfter.id) {
                contentAfter.id = 'event-detail-content';
              }
            });
          } else {
            // Fallback: direct fetch
            fetch('/events/' + eventId)
              .then(res => res.text())
              .then(html => {
                content.outerHTML = html;
                // Restore the id on the new element
                const newContent = document.querySelector('#modal-event-detail .modal-card');
                if (newContent) {
                  newContent.id = 'event-detail-content';
                }
                // Ensure modal is open after content loads
                const modalAfter = document.getElementById('modal-event-detail');
                if (modalAfter) {
                  modalAfter.classList.add('open');
                }
              })
              .catch(err => {
                content.innerHTML = '<div class="alert alert--error">Failed to load event details.</div>';
                const modalAfter = document.getElementById('modal-event-detail');
                if (modalAfter) {
                  modalAfter.classList.add('open');
                }
              });
          }
        }
      };
      
      // Close event modal on ESC key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          const modal = document.getElementById('modal-event-detail');
          if (modal && modal.classList.contains('open')) {
            closeModal('modal-event-detail');
          }
        }
      });
      
      // Close modal when clicking outside (delegated event listener)
      document.addEventListener('click', function(e) {
        const modal = document.getElementById('modal-event-detail');
        if (modal && modal.classList.contains('open') && e.target === modal) {
          closeModal('modal-event-detail');
        }
      });
    </script>
  `;
}

/**
 * Render schedule wrapper for HTMX targeting
 * @param {Object} classInfo - Class information
 * @param {string} view - 'week' or 'day'
 * @param {Date} currentDate - Current date for the view
 * @param {Array} dbEvents - Array of database event objects
 * @returns {string} HTML string
 */
export function renderScheduleWrapper(
  classInfo,
  view = "week",
  currentDate = new Date(),
  dbEvents = [],
  allowedEventTypes = [],
  groupsData = {},
) {
  return `
    <div id="schedule-wrapper">
      ${renderSchedulePage(classInfo, view, currentDate, dbEvents, allowedEventTypes, groupsData)}
    </div>
  `;
}

/**
 * Get allowed event types based on user role and group leader status
 * Returns DB enum values (COURSE_LECTURE, etc.)
 * @param {string|null} classRole - User's class role (PROFESSOR, TA, TUTOR, STUDENT, or null)
 * @param {boolean} isGroupLeader - Whether user is a group leader in this class
 * @returns {Array<string>} Array of allowed event type DB enum values
 */
function getAllowedEventTypes(classRole, isGroupLeader) {
  // Professor, TA, Tutor, and Group Leader can all create GROUP_MEETING
  // Professor or TA can create all event types including COURSE_DISCUSSION and GROUP_MEETING
  if (classRole === "PROFESSOR" || classRole === "TA") {
    return [
      "COURSE_LECTURE",
      "COURSE_OFFICE_HOUR",
      "COURSE_DISCUSSION",
      "GROUP_MEETING",
      "OTHER",
    ];
  }

  // Tutor can create office hours, discussion, meeting, and other (no lecture)
  if (classRole === "TUTOR") {
    return ["COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER"];
  }

  // Group leaders (who are not Professor/TA/Tutor) can only create group meetings
  if (isGroupLeader) {
    return ["GROUP_MEETING"];
  }

  // Any other role (STUDENT or no role) - no event types allowed
  return [];
}

/**
 * Render event type dropdown options
 * Uses DB enum values (COURSE_LECTURE, etc.)
 * @param {Array<string>} allowedTypes - Array of allowed event type DB enum values
 * @returns {string} HTML string for select options
 */
function renderEventTypeOptions(allowedTypes) {
  if (allowedTypes.length === 0) {
    return '<option value="">No event types available</option>';
  }

  return allowedTypes
    .map(
      (type) =>
        `<option value="${escapeHtml(type)}">${escapeHtml(getEventTypeLabel(type))}</option>`,
    )
    .join("");
}

/**
 * Render group dropdown options
 * @param {Array} groups - Array of group objects with id and name
 * @param {boolean} isGroupLeader - Whether user is a group leader
 * @param {string|null} leaderGroupId - ID of the group the user leads (if leader)
 * @returns {string} HTML string for select options
 */
function renderGroupOptions(groups = [], isGroupLeader = false, leaderGroupId = null) {
  if (groups.length === 0) {
    return '<option value="">No groups available</option>';
  }

  // If user is a group leader, show only their group
  if (isGroupLeader && leaderGroupId) {
    const leaderGroup = groups.find((g) => g.id === leaderGroupId);
    if (leaderGroup) {
      return `<option value="${escapeHtml(leaderGroup.id)}">${escapeHtml(leaderGroup.name)}</option>`;
    }
  }

  // Otherwise show all groups
  return (
    '<option value="">-- Select a group --</option>' +
    groups
      .map(
        (group) =>
          `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`,
      )
      .join("")
  );
}

/**
 * Render create-event modal for a specific class.
 *
 * @param {string} classId - ID of the class the event belongs to
 * @param {string} [minDate] - Minimum date in YYYY-MM-DD format (PST today)
 * @param {Array<string>} [allowedEventTypes=[]] - Array of allowed event type values
 * @param {Object} [groupsData={}] - Groups data (allGroups, isGroupLeader, leaderGroupId)
 * @returns {string} HTML string
 */
function renderCreateEventModal(
  classId,
  minDate = null,
  allowedEventTypes = [],
  groupsData = {},
) {
  // Calculate PST today if not provided
  if (!minDate) {
    const pstDate = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    const today = new Date(pstDate);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    minDate = `${yyyy}-${mm}-${dd}`;
  }

  const hasNoPermissions = allowedEventTypes.length === 0;
  const eventTypeOptions = renderEventTypeOptions(allowedEventTypes);

  // Extract groups data
  const groups = groupsData.allGroups || [];
  const isGroupLeader = groupsData.isGroupLeader || false;
  const leaderGroupId = groupsData.leaderGroupId || null;
  const groupOptions = renderGroupOptions(groups, isGroupLeader, leaderGroupId);
  const isGroupDropdownDisabled = isGroupLeader && leaderGroupId !== null;

  return `
    <div id="modal-create-event" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Create Event</h3>
          <button class="btn-close" onclick="closeModal('modal-create-event')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <form 
          id="create-event-form"
          hx-post="/events/create"
          hx-target="#schedule-wrapper"
          hx-swap="outerHTML"
        >
          <div id="event-form-errors"></div>
          <div class="modal-body">
            <input type="hidden" name="classId" value="${escapeHtml(classId)}">
            <div class="form-group">
              <label class="form-label">Event Title</label>
              <input type="text" name="title" class="form-input" placeholder="e.g. Lecture 1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Event Type</label>
              <select name="type" id="event-type-select" class="form-select" ${hasNoPermissions ? "disabled" : ""} required>
                ${eventTypeOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Group</label>
              <select name="group" id="event-group-select" class="form-select" ${isGroupDropdownDisabled ? "disabled" : ""}>
                ${groupOptions}
              </select>
              ${isGroupDropdownDisabled && leaderGroupId ? `<input type="hidden" name="group" value="${escapeHtml(leaderGroupId)}">` : ""}
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" class="form-input" min="${minDate}" required>
            </div>
            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div>
                <label class="form-label">Start Time</label>
                <input type="time" name="startTime" id="event-start-time" class="form-input" required>
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input type="time" name="endTime" id="event-end-time" class="form-input" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Location (Optional)</label>
              <input type="text" name="location" class="form-input" placeholder="e.g. Room 101">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-create-event')">Cancel</button>
            <button type="submit" class="btn btn--primary">Create Event</button>
          </div>
        </form>
      </div>
    </div>
    <script>
      // Client-side validation
      (function() {
        const form = document.getElementById('create-event-form');
        const startTimeInput = document.getElementById('event-start-time');
        const endTimeInput = document.getElementById('event-end-time');
        const typeSelect = document.getElementById('event-type-select');
        const groupSelect = document.getElementById('event-group-select');
        const errorContainer = document.getElementById('event-form-errors');

        function validateTimes() {
          if (!startTimeInput || !endTimeInput) return true;

          const startTime = startTimeInput.value;
          const endTime = endTimeInput.value;

          if (startTime && endTime && endTime <= startTime) {
            endTimeInput.setCustomValidity('End time must be later than start time');
            if (errorContainer) {
              errorContainer.innerHTML = '<div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);"><strong>Error:</strong> End time must be later than start time.</div>';
            }
            return false;
          } else {
            endTimeInput.setCustomValidity('');
            return true;
          }
        }

        function validateGroup() {
          if (!typeSelect || !groupSelect) return true;

          const eventType = typeSelect.value;
          const groupId = groupSelect.value;

          if (eventType === 'GROUP_MEETING') {
            if (!groupId || groupId.trim() === '') {
              groupSelect.setCustomValidity('Group is required for group meetings');
              if (errorContainer) {
                errorContainer.innerHTML = '<div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);"><strong>Error:</strong> Group is required for group meetings.</div>';
              }
              return false;
            } else {
              groupSelect.setCustomValidity('');
              return true;
            }
          } else {
            groupSelect.setCustomValidity('');
            return true;
          }
        }

        function clearErrors() {
          if (errorContainer && errorContainer.innerHTML.includes('Error:')) {
            const timeError = errorContainer.innerHTML.includes('End time must be later');
            const groupError = errorContainer.innerHTML.includes('Group is required');
            if (!timeError && !groupError) {
              errorContainer.innerHTML = '';
            }
          }
        }

        // Validate times
        if (startTimeInput && endTimeInput) {
          startTimeInput.addEventListener('change', function() {
            validateTimes();
            clearErrors();
          });
          startTimeInput.addEventListener('input', function() {
            validateTimes();
            clearErrors();
          });
          endTimeInput.addEventListener('change', function() {
            validateTimes();
            clearErrors();
          });
          endTimeInput.addEventListener('input', function() {
            validateTimes();
            clearErrors();
          });
        }

        // Validate group when type changes
        if (typeSelect) {
          typeSelect.addEventListener('change', function() {
            validateGroup();
            clearErrors();
          });
        }

        // Validate group when selection changes
        if (groupSelect) {
          groupSelect.addEventListener('change', function() {
            validateGroup();
            clearErrors();
          });
        }

        if (form) {
          form.addEventListener('submit', function(e) {
            const timesValid = validateTimes();
            const groupValid = validateGroup();
            
            if (!timesValid || !groupValid) {
              e.preventDefault();
              if (window.showToast) {
                if (!timesValid) {
                  window.showToast('Validation Error', 'End time must be later than start time', 'error');
                } else if (!groupValid) {
                  window.showToast('Validation Error', 'Group is required for group meetings', 'error');
                }
              }
              return false;
            }
          });
        }
      })();

      window.switchScheduleView = function(view, date) {
        const url = new URL(window.location);
        url.searchParams.set("view", view);
        url.searchParams.set("date", date);
        window.location.href = url.toString();
      };
      window.navigateSchedule = function(view, date) {
        const url = new URL(window.location);
        url.searchParams.set("view", view);
        url.searchParams.set("date", date);
        window.location.href = url.toString();
      };
    </script>
  `;
}

/**
 * Render event detail modal
 * @param {Object} event - Event object from database
 * @param {Object} classInfo - Class information
 * @param {Array<string>} allowedEventTypes - Allowed event types for editing
 * @param {Object} groupsData - Groups data
 * @returns {string} HTML string
 */
export function renderEventDetailModal(event, classInfo, allowedEventTypes = [], groupsData = {}) {
  if (!event) {
    return `
      <div id="event-detail-content" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Event Not Found</h3>
          <button class="btn-close" onclick="closeModal('modal-event-detail')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>The requested event could not be found.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn--secondary" onclick="closeModal('modal-event-detail')">
            Close
          </button>
        </div>
      </div>
    `;
  }

  const eventId = escapeHtml(event.id);
  const title = escapeHtml(event.title || "Untitled Event");
  const description = escapeHtml(event.description || "No description provided.");
  const location = escapeHtml(event.location || "");
  const eventType = event.type || "OTHER";
  const eventTypeLabel = getEventTypeLabel(eventType);
  
  // Format dates
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const startDateStr = startDate.toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    timeZone: "America/Los_Angeles"
  });
  const startTimeStr = startDate.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });
  const endTimeStr = endDate.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });
  
  const className = escapeHtml(classInfo?.name || "Unknown Class");
  const groupName = event.group ? escapeHtml(event.group.name) : null;
  const creatorName = event.user ? escapeHtml(event.user.preferredName || event.user.name || "Unknown") : "Unknown";

  return `
    <div id="event-detail-content" class="modal-card" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn-close" onclick="closeModal('modal-event-detail')">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
        <div class="event-detail-section">
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-solid fa-calendar"></i> Date
            </div>
            <div class="event-detail-value">${startDateStr}</div>
          </div>
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-regular fa-clock"></i> Time
            </div>
            <div class="event-detail-value">${startTimeStr} - ${endTimeStr}</div>
          </div>
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-solid fa-tag"></i> Type
            </div>
            <div class="event-detail-value">
              <span class="event-type-badge ${getEventTypeClass(eventType)}">${eventTypeLabel}</span>
            </div>
          </div>
          ${location ? `
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-solid fa-location-dot"></i> Location
            </div>
            <div class="event-detail-value">${location}</div>
          </div>
          ` : ""}
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-solid fa-book"></i> Course
            </div>
            <div class="event-detail-value">${className}</div>
          </div>
          ${groupName ? `
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-solid fa-users"></i> Group
            </div>
            <div class="event-detail-value">${groupName}</div>
          </div>
          ` : ""}
          <div class="event-detail-item">
            <div class="event-detail-label">
              <i class="fa-solid fa-user"></i> Created By
            </div>
            <div class="event-detail-value">${creatorName}</div>
          </div>
          <div class="event-detail-item event-detail-item--full">
            <div class="event-detail-label">
              <i class="fa-solid fa-align-left"></i> Description
            </div>
            <div class="event-detail-value">${description}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn--secondary" onclick="closeModal('modal-event-detail')">
          Close
        </button>
        ${allowedEventTypes.includes(eventType) ? `
        <button type="button" class="btn btn--primary" onclick="openEditEventModal('${eventId}')">
          <i class="fa-solid fa-edit"></i> Edit
        </button>
        <button 
          type="button" 
          class="btn btn--danger" 
          onclick="deleteEvent('${eventId}')"
          style="margin-left: var(--space-2);"
        >
          <i class="fa-solid fa-trash"></i> Delete
        </button>
        ` : ""}
      </div>
    </div>
    <style>
      .event-detail-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .event-detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .event-detail-item--full {
        margin-top: var(--space-2);
      }
      .event-detail-label {
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .event-detail-label i {
        width: 16px;
        text-align: center;
      }
      .event-detail-value {
        font-size: var(--text-base);
        color: var(--color-text-main);
        padding-left: calc(16px + var(--space-2));
      }
      .event-type-badge {
        display: inline-block;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: var(--weight-medium);
      }
    </style>
    <script>
      window.openEditEventModal = function(eventId) {
        // Load edit form via HTMX
        const modal = document.getElementById('modal-event-detail');
        const content = document.getElementById('event-detail-content');
        if (!modal || !content) return;
        
        if (typeof htmx !== 'undefined') {
          htmx.ajax('GET', '/events/' + eventId + '/edit', {
            target: '#event-detail-content',
            swap: 'outerHTML',
          }).then(() => {
            // Ensure modal is open after content loads
            const modalAfter = document.getElementById('modal-event-detail');
            if (modalAfter) {
              modalAfter.classList.add('open');
            }
            // Restore the id if needed
            const contentAfter = document.querySelector('#modal-event-detail .modal-card');
            if (contentAfter && !contentAfter.id) {
              contentAfter.id = 'event-detail-content';
            }
          });
        } else {
          // Fallback: direct fetch
          fetch('/events/' + eventId + '/edit')
            .then(res => res.text())
            .then(html => {
              content.outerHTML = html;
              // Restore the id on the new element
              const newContent = document.querySelector('#modal-event-detail .modal-card');
              if (newContent) {
                newContent.id = 'event-detail-content';
              }
              // Ensure modal is open after content loads
              const modalAfter = document.getElementById('modal-event-detail');
              if (modalAfter) {
                modalAfter.classList.add('open');
              }
            })
            .catch(err => {
              content.innerHTML = '<div class="alert alert--error">Failed to load edit form.</div>';
              const modalAfter = document.getElementById('modal-event-detail');
              if (modalAfter) {
                modalAfter.classList.add('open');
              }
            });
        }
      };
      
      window.deleteEvent = function(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
          return;
        }
        
        if (typeof htmx !== 'undefined') {
          htmx.ajax('DELETE', '/events/' + eventId, {
            target: '#schedule-wrapper',
            swap: 'outerHTML',
            headers: { 'HX-Request': 'true' },
          }).then(() => {
            closeModal('modal-event-detail');
            if (window.showToast) {
              window.showToast('Success', 'Event deleted successfully', 'success');
            }
          });
        }
      };
    </script>
  `;
}

/**
 * Render edit event modal
 * @param {Object} event - Event object from database
 * @param {Object} classInfo - Class information
 * @param {Array<string>} allowedEventTypes - Allowed event types
 * @param {Object} groupsData - Groups data
 * @returns {string} HTML string
 */
export function renderEditEventModal(event, classInfo, allowedEventTypes = [], groupsData = {}) {
  if (!event) {
    return `
      <div id="event-detail-content" class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Event Not Found</h3>
          <button class="btn-close" onclick="closeModal('modal-event-detail')">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>The requested event could not be found.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn--secondary" onclick="closeModal('modal-event-detail')">
            Close
          </button>
        </div>
      </div>
    `;
  }

  const eventId = escapeHtml(event.id);
  const classId = escapeHtml(event.classId);
  const title = escapeHtml(event.title || "");
  const description = escapeHtml(event.description || "");
  const location = escapeHtml(event.location || "");
  const eventType = event.type || "OTHER";
  
  // Format dates for form inputs
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  
  // Get PST date/time strings
  const dateStr = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Los_Angeles"
  }).split("/");
  const formattedDate = `${dateStr[2]}-${dateStr[0].padStart(2, "0")}-${dateStr[1].padStart(2, "0")}`;
  
  const startTimeStr = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles"
  });
  const endTimeStr = endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles"
  });

  // Calculate PST today for min date
  const pstDate = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const today = new Date(pstDate);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  const eventTypeOptions = renderEventTypeOptions(allowedEventTypes);
  const groups = groupsData.allGroups || [];
  const isGroupLeader = groupsData.isGroupLeader || false;
  const leaderGroupId = groupsData.leaderGroupId || null;
  let groupOptions = renderGroupOptions(groups, isGroupLeader, leaderGroupId);
  const selectedGroupId = event.groupId || "";
  
  // Mark selected group
  if (selectedGroupId && groupOptions.includes(`value="${selectedGroupId}"`)) {
    groupOptions = groupOptions.replace(
      `value="${selectedGroupId}"`,
      `value="${selectedGroupId}" selected`
    );
  }
  
  // Mark selected event type
  let finalEventTypeOptions = eventTypeOptions;
  if (eventTypeOptions.includes(`value="${eventType}"`)) {
    finalEventTypeOptions = eventTypeOptions.replace(
      `value="${eventType}"`,
      `value="${eventType}" selected`
    );
  }
  
  const isGroupDropdownDisabled = isGroupLeader && leaderGroupId !== null;

  return `
    <div id="event-detail-content" class="modal-card" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Edit Event</h3>
        <button class="btn-close" onclick="closeModal('modal-event-detail')">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <form 
        id="edit-event-form"
        hx-put="/events/${eventId}"
        hx-target="#schedule-wrapper"
        hx-swap="outerHTML"
      >
          <div id="event-form-errors"></div>
          <div class="modal-body">
            <input type="hidden" name="classId" value="${classId}">
            <div class="form-group">
              <label class="form-label">Event Title</label>
              <input type="text" name="title" class="form-input" value="${title}" placeholder="e.g. Lecture 1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Event Type</label>
              <select name="type" id="event-type-select" class="form-select" required>
                ${finalEventTypeOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Group</label>
              <select name="group" id="event-group-select" class="form-select" ${isGroupDropdownDisabled ? "disabled" : ""}>
                ${groupOptions}
              </select>
              ${isGroupDropdownDisabled && leaderGroupId ? `<input type="hidden" name="group" value="${escapeHtml(leaderGroupId)}">` : ""}
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" class="form-input" min="${minDate}" value="${formattedDate}" required>
            </div>
            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div>
                <label class="form-label">Start Time</label>
                <input type="time" name="startTime" id="event-start-time" class="form-input" value="${startTimeStr}" required>
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input type="time" name="endTime" id="event-end-time" class="form-input" value="${endTimeStr}" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Location (Optional)</label>
              <input type="text" name="location" class="form-input" value="${location}" placeholder="e.g. Room 101">
            </div>
            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <textarea name="description" class="form-input" rows="3" placeholder="Event description...">${description}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn--secondary" onclick="closeModal('modal-event-detail')">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
    <script>
      // Client-side validation (same as create form)
      (function() {
        const form = document.getElementById('edit-event-form');
        const startTimeInput = document.getElementById('event-start-time');
        const endTimeInput = document.getElementById('event-end-time');
        const typeSelect = document.getElementById('event-type-select');
        const groupSelect = document.getElementById('event-group-select');
        const errorContainer = document.getElementById('event-form-errors');

        function validateTimes() {
          if (!startTimeInput || !endTimeInput) return true;
          const startTime = startTimeInput.value;
          const endTime = endTimeInput.value;
          if (startTime && endTime && endTime <= startTime) {
            endTimeInput.setCustomValidity('End time must be later than start time');
            if (errorContainer) {
              errorContainer.innerHTML = '<div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);"><strong>Error:</strong> End time must be later than start time.</div>';
            }
            return false;
          } else {
            endTimeInput.setCustomValidity('');
            return true;
          }
        }

        function validateGroup() {
          if (!typeSelect || !groupSelect) return true;
          const eventType = typeSelect.value;
          const groupId = groupSelect.value;
          if (eventType === 'GROUP_MEETING') {
            if (!groupId || groupId.trim() === '') {
              groupSelect.setCustomValidity('Group is required for group meetings');
              if (errorContainer) {
                errorContainer.innerHTML = '<div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);"><strong>Error:</strong> Group is required for group meetings.</div>';
              }
              return false;
            } else {
              groupSelect.setCustomValidity('');
              return true;
            }
          } else {
            groupSelect.setCustomValidity('');
            return true;
          }
        }

        if (startTimeInput && endTimeInput) {
          startTimeInput.addEventListener('change', validateTimes);
          startTimeInput.addEventListener('input', validateTimes);
          endTimeInput.addEventListener('change', validateTimes);
          endTimeInput.addEventListener('input', validateTimes);
        }

        if (typeSelect) {
          typeSelect.addEventListener('change', validateGroup);
        }

        if (groupSelect) {
          groupSelect.addEventListener('change', validateGroup);
        }

        if (form) {
          form.addEventListener('submit', function(e) {
            const timesValid = validateTimes();
            const groupValid = validateGroup();
            if (!timesValid || !groupValid) {
              e.preventDefault();
              if (window.showToast) {
                if (!timesValid) {
                  window.showToast('Validation Error', 'End time must be later than start time', 'error');
                } else if (!groupValid) {
                  window.showToast('Validation Error', 'Group is required for group meetings', 'error');
                }
              }
              return false;
            }
          });
        }
      })();
    </script>
  `;
}
