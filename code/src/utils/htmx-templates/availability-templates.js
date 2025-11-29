/**
 * Availability Page Templates
 * code/src/utils/htmx-templates/availability-templates.js
 *
 * Frontend-only weekly availability planner with dummy data.
 */

import { escapeHtml } from "../html-templates.js";

/**
 * Render weekly availability page
 * @param {Object} user - Current user (for greeting)
 * @returns {string} HTML string
 */
export function renderAvailabilityPage(user) {
  const displayName = escapeHtml(user?.name || "Student");

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = [
    "8:00 AM",
    "8:30 AM",
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
    "5:00 PM",
  ];

  /**
   * Dummy availability pattern used for initial grid state.
   *
   * @param {number} dayIndex - Index of day (0-6, Sunday–Saturday)
   * @param {number} slotIndex - Index of time slot in the grid
   * @returns {boolean} True if this cell should be marked available
   */
  const isInitiallyAvailable = (dayIndex, slotIndex) =>
    dayIndex >= 1 && dayIndex <= 4 && slotIndex >= 8 && slotIndex <= 15;

  const header = `
    <div style="margin-bottom: var(--space-6);">
      <h1 style="font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: 4px;">
        Availability Planning
      </h1>
      <p style="font-size: var(--text-sm); color: var(--color-text-muted);">
        Tell your teammates when you are generally available to meet this week.
      </p>
    </div>
  `;

  const tableHeader = `
    <thead>
      <tr>
        <th class="availability-cell availability-cell--time">Time</th>
        ${days
          .map(
            (day) => `
          <th class="availability-cell availability-cell--day">
            ${escapeHtml(day)}
          </th>`,
          )
          .join("")}
      </tr>
    </thead>
  `;

  const tableBody = `
    <tbody>
      ${timeSlots
        .map((time, rowIdx) => {
          const cells = days
            .map((_, dayIdx) => {
              const active = isInitiallyAvailable(dayIdx, rowIdx);
              const classes = [
                "availability-cell",
                "availability-cell--slot",
                active ? "availability-cell--active" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return `
                <td 
                  class="${classes}" 
                  data-day="${dayIdx}" 
                  data-time="${escapeHtml(time)}"
                  onclick="toggleAvailabilityCell(this)"
                  role="button"
                  aria-pressed="${active ? "true" : "false"}"
                  tabindex="0"
                ></td>
              `;
            })
            .join("");

          return `
            <tr>
              <th class="availability-cell availability-cell--time">
                ${escapeHtml(time)}
              </th>
              ${cells}
            </tr>
          `;
        })
        .join("")}
    </tbody>
  `;

  const legend = `
    <div class="availability-legend">
      <div class="availability-legend__item">
        <span class="availability-legend__swatch availability-legend__swatch--active"></span>
        <span>Available</span>
      </div>
      <div class="availability-legend__item">
        <span class="availability-legend__swatch availability-legend__swatch--inactive"></span>
        <span>Unavailable</span>
      </div>
    </div>
  `;

  const toolbar = `
    <div class="card-header availability-header">
      <div class="card-title">
        <i class="fa-regular fa-calendar"></i>
        <span>My Weekly Availability</span>
      </div>
      <div style="display:flex; align-items: center; gap: var(--space-3);">
        <span class="availability-helper-text">
          Drag or click time blocks to mark when you are free.
        </span>
        <button 
          type="button" 
          class="btn btn--secondary btn--sm"
          onclick="resetAvailabilityGrid()"
        >
          Clear
        </button>
        <button 
          type="button" 
          class="btn btn--primary btn--sm"
          onclick="saveAvailabilityDummy()"
        >
          Save availability
        </button>
      </div>
    </div>
  `;

  const scriptHelpers = `
    <script>
      window.toggleAvailabilityCell = function (cell) {
        if (!cell) return;
        const isActive = cell.classList.toggle("availability-cell--active");
        cell.setAttribute("aria-pressed", isActive ? "true" : "false");
      };

      window.resetAvailabilityGrid = function () {
        document
          .querySelectorAll(".availability-cell--slot.availability-cell--active")
          .forEach((cell) => {
            cell.classList.remove("availability-cell--active");
            cell.setAttribute("aria-pressed", "false");
          });
      };

      window.saveAvailabilityDummy = function () {
        if (window.showToast) {
          window.showToast(
            "Availability saved",
            "We saved this week\\'s availability on this device. Backend integration coming soon.",
            "success"
          );
        }
      };
    </script>
  `;

  return `
    ${header}
    <div class="availability-card">
      ${toolbar}
      <div class="availability-card__body">
        <div class="availability-card__intro">
          <h2 class="availability-greeting">Hi, ${displayName} 👋</h2>
          <p class="availability-subtitle">
            Use the grid to share when you are generally free for team meetings this week.
          </p>
          ${legend}
        </div>
        <div class="availability-grid-wrapper" role="region" aria-label="Weekly availability grid">
          <table class="availability-grid">
            ${tableHeader}
            ${tableBody}
          </table>
        </div>
      </div>
    </div>
    ${scriptHelpers}
  `;
}
