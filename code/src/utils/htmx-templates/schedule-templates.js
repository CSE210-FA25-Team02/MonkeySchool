/**
 * Schedule Calendar Templates
 * code/src/utils/htmx-templates/schedule-templates.js
 *
 * Frontend-only schedule calendar with dummy data.
 * Supports week view and day view.
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Generate dummy events for a class.
 *
 * @param {string} classId - Class ID
 * @param {Date} startDate - Start of the week/day
 * @returns {Array} Array of event objects
 */
function generateDummyEvents(classId, startDate) {
  const events = [];

  // Monday - Office Hours
  const monday = new Date(startDate);
  monday.setDate(startDate.getDate() + ((1 - startDate.getDay() + 7) % 7));
  const mondayStart = new Date(monday);
  mondayStart.setHours(7, 30, 0, 0);
  const mondayEnd = new Date(monday);
  mondayEnd.setHours(9, 3, 0, 0);
  events.push({
    id: "evt-1",
    title: "Office Hours",
    start: mondayStart,
    end: mondayEnd,
    type: "office-hours",
    location: "",
  });

  // Monday - Lecture
  const monday2 = new Date(startDate);
  monday2.setDate(startDate.getDate() + ((1 - startDate.getDay() + 7) % 7));
  const monday2Start = new Date(monday2);
  monday2Start.setHours(12, 0, 0, 0);
  const monday2End = new Date(monday2);
  monday2End.setHours(13, 30, 0, 0);
  events.push({
    id: "evt-2",
    title: "Lecture 1",
    start: monday2Start,
    end: monday2End,
    type: "lecture",
    location: "San Diego, CA, USA",
  });

  // Tuesday - Office Hours
  const tuesday = new Date(startDate);
  tuesday.setDate(startDate.getDate() + ((2 - startDate.getDay() + 7) % 7));
  const tuesdayStart = new Date(tuesday);
  tuesdayStart.setHours(11, 0, 0, 0);
  const tuesdayEnd = new Date(tuesday);
  tuesdayEnd.setHours(13, 0, 0, 0);
  events.push({
    id: "evt-3",
    title: "Office Hours",
    start: tuesdayStart,
    end: tuesdayEnd,
    type: "office-hours",
    location: "",
  });

  // Tuesday - Team Meeting
  const tuesday2 = new Date(startDate);
  tuesday2.setDate(startDate.getDate() + ((2 - startDate.getDay() + 7) % 7));
  const tuesday2Start = new Date(tuesday2);
  tuesday2Start.setHours(14, 0, 0, 0);
  const tuesday2End = new Date(tuesday2);
  tuesday2End.setHours(14, 30, 0, 0);
  events.push({
    id: "evt-4",
    title: "Weekly Team Meeting",
    start: tuesday2Start,
    end: tuesday2End,
    type: "meeting",
    location: "Conference Room A, Team Alpha",
  });

  // Tuesday - Lecture
  const tuesday3 = new Date(startDate);
  tuesday3.setDate(startDate.getDate() + ((2 - startDate.getDay() + 7) % 7));
  const tuesday3Start = new Date(tuesday3);
  tuesday3Start.setHours(23, 10, 0, 0);
  const tuesday3End = new Date(tuesday3);
  tuesday3End.setHours(23, 44, 0, 0);
  events.push({
    id: "evt-5",
    title: "Lecture 5",
    start: tuesday3Start,
    end: tuesday3End,
    type: "lecture",
    location: "",
  });

  // Wednesday - Lecture
  const wednesday = new Date(startDate);
  wednesday.setDate(startDate.getDate() + ((3 - startDate.getDay() + 7) % 7));
  const wednesdayStart = new Date(wednesday);
  wednesdayStart.setHours(23, 6, 0, 0);
  const wednesdayEnd = new Date(wednesday);
  wednesdayEnd.setHours(23, 57, 0, 0);
  events.push({
    id: "evt-6",
    title: "Lecture",
    start: wednesdayStart,
    end: wednesdayEnd,
    type: "lecture",
    location: "",
  });

  return events;
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
 *
 * @param {string} type - Event type identifier
 * @returns {string} CSS class name
 */
function getEventTypeClass(type) {
  const map = {
    "office-hours": "schedule-event--office-hours",
    lecture: "schedule-event--lecture",
    meeting: "schedule-event--meeting",
    default: "schedule-event--default",
  };
  return map[type] || map.default;
}

/**
 * Get Font Awesome icon class for a given event type.
 *
 * @param {string} type - Event type identifier
 * @returns {string} Icon class name
 */
function getEventTypeIcon(type) {
  const map = {
    "office-hours": "fa-clock",
    lecture: "fa-chalkboard",
    meeting: "fa-users",
    default: "fa-circle",
  };
  return map[type] || map.default;
}

/**
 * Render schedule calendar page
 * @param {Object} classInfo - Class information
 * @param {string} view - 'week' or 'day'
 * @param {Date} currentDate - Current date for the view
 * @returns {string} HTML string
 */
export function renderSchedulePage(
  classInfo,
  view = "week",
  currentDate = new Date(),
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

  // Generate dummy events
  const allEvents = generateDummyEvents(classId, weekStart);

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

  // Get week dates
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDates.push({
      date,
      dayName: days[i],
      dayAbbr: dayAbbr[i],
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
                      <div class="schedule-event ${getEventTypeClass(event.type)}" data-event-id="${event.id}">
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
                  <div class="schedule-event ${getEventTypeClass(event.type)}" data-event-id="${event.id}">
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
    ${renderCreateEventModal(classId)}
  `;
}

/**
 * Render create-event modal for a specific class.
 *
 * @param {string} classId - ID of the class the event belongs to
 * @returns {string} HTML string
 */
function renderCreateEventModal(classId) {
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
          onsubmit="event.preventDefault(); saveEventDummy(); closeModal('modal-create-event');"
        >
          <div class="modal-body">
            <input type="hidden" name="classId" value="${escapeHtml(classId)}">
            <div class="form-group">
              <label class="form-label">Event Title</label>
              <input type="text" name="title" class="form-input" placeholder="e.g. Lecture 1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Event Type</label>
              <select name="type" class="form-select">
                <option value="lecture">Lecture</option>
                <option value="office-hours">Office Hours</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" name="date" class="form-input" required>
            </div>
            <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div>
                <label class="form-label">Start Time</label>
                <input type="time" name="startTime" class="form-input" required>
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input type="time" name="endTime" class="form-input" required>
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
      window.saveEventDummy = function() {
        if (window.showToast) {
          window.showToast(
            "Event created",
            "Event has been added to the calendar. Backend integration coming soon.",
            "success"
          );
        }
      };
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
