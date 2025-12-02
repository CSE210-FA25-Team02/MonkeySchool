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
 * @param {Array} userAvailability - User's existing availability records
 * @param {Array} groupsAvailability - User's groups and their availability
 * @returns {string} HTML string
 */
/**
 * Render just the group availability sections
 * @param {Array} groupsAvailability - User's groups and their availability
 * @returns {string} HTML string for group sections
 */
export function renderGroupAvailabilitySections(groupsAvailability = []) {
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
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
  ];

  /**
   * Convert 12h time format to 24h format
   * @param {string} time12h - Time in 12h format (e.g., "9:00 AM")
   * @returns {string} Time in 24h format (e.g., "09:00")
   */
  const convertToTime24h = (time12h) => {
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  /**
   * Calculate availability count for a time slot across all group members
   * @param {Array} members - Group members with their availability
   * @param {number} dayIndex - Day of week index (0-6)
   * @param {string} timeSlot - Time slot (e.g., "9:00 AM")
   * @returns {Object} {available, total, availableNames} count and available member names
   */
  const getGroupTimeSlotAvailability = (members, dayIndex, timeSlot) => {
    const time24h = convertToTime24h(timeSlot);
    let available = 0;
    const total = members.length;
    const availableNames = [];

    members.forEach(member => {
      const isAvailable = member.availability.some(avail => {
        if (avail.dayOfWeek !== dayIndex) return false;
        return time24h >= avail.startTime && time24h < avail.endTime;
      });
      if (isAvailable) {
        available++;
        availableNames.push(member.name);
      }
    });

    return { available, total, availableNames };
  };

  /**
   * Get CSS class for availability intensity
   * @param {number} available - Number of people available
   * @param {number} total - Total number of people
   * @returns {string} CSS class name
   */
  const getAvailabilityIntensityClass = (available, total) => {
    if (available === 0) return '';
    const intensity = Math.ceil((available / total) * 5); // 1-5 scale
    return `group-availability--intensity-${intensity}`;
  };

  /**
   * Render a single group availability section
   * @param {Object} group - Group data with members
   * @returns {string} HTML string for group section
   */
  const renderGroupAvailabilitySection = (group) => {
    const sectionId = `group-${group.id}`;
    const sectionTitle = `${escapeHtml(group.class.name)}-${escapeHtml(group.name)} Weekly Availability`;
    
    const tableHeader = `
      <thead>
        <tr>
          <th class="group-availability-cell group-availability-cell--time">Time</th>
          ${days
            .map(
              (day) => `
            <th class="group-availability-cell group-availability-cell--day">
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
          .map((time) => {
            const cells = days
              .map((_, dayIdx) => {
                const { available, total, availableNames } = getGroupTimeSlotAvailability(group.members, dayIdx, time);
                const intensityClass = getAvailabilityIntensityClass(available, total);
                const classes = [
                  "group-availability-cell",
                  "group-availability-cell--slot",
                  intensityClass
                ]
                  .filter(Boolean)
                  .join(" ");
                
                const namesDisplay = availableNames.length > 0 ? availableNames.join(', ') : '';
                const shortNames = availableNames.length > 0 ? 
                  (availableNames.length <= 2 ? namesDisplay : `${availableNames[0]}+${availableNames.length - 1}`) : '';
                
                return `
                  <td 
                    class="${classes}" 
                    title="${available}/${total} available"
                    data-available="${available}"
                    data-total="${total}"
                    data-available-names="${escapeHtml(namesDisplay)}"
                  >
                    ${availableNames.length > 0 ? `<span class="available-names">${escapeHtml(shortNames)}</span>` : ''}
                  </td>
                `;
              })
              .join("");

            return `
              <tr>
                <th class="group-availability-cell group-availability-cell--time">
                  ${escapeHtml(time)}
                </th>
                ${cells}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    `;

    return `
      <div class="group-availability-section" data-group-id="${escapeHtml(group.id)}">
        <div class="card-header group-availability-header">
          <div class="card-title">
            <i class="fas fa-users"></i>
            <span>${sectionTitle}</span>
          </div>
          <button 
            type="button" 
            class="group-availability-toggle"
            onclick="toggleGroupAvailability('${escapeHtml(group.id)}')"
            aria-expanded="false"
            aria-controls="${sectionId}-content"
          >
            <i class="fas fa-chevron-up"></i>
          </button>
        </div>
        <div 
          id="${sectionId}-content" 
          class="group-availability-content"
          style="display: none;"
        >
          <div class="group-availability-members">
            <p class="group-availability-members-text">
              <strong>Members (${group.members.length}):</strong>
              ${group.members.map(member => escapeHtml(member.name)).join(', ')}
            </p>
          </div>
          <div class="group-availability-grid-wrapper">
            <table class="group-availability-grid">
              ${tableHeader}
              ${tableBody}
            </table>
          </div>
        </div>
      </div>
    `;
  };

  return groupsAvailability.length > 0 ? `
    <div id="group-availability-sections" class="group-availability-sections">
      <div class="group-availability-sections-header">
        <h2>Group Availability</h2>
        <p class="group-availability-subtitle">
          See when your team members are available for meetings.
        </p>
      </div>
      ${groupsAvailability.map(group => renderGroupAvailabilitySection(group)).join('')}
    </div>
  ` : '<div id="group-availability-sections"></div>';
}

/**
 * Render complete availability page with personal and group availability
 * @param {Object} user - Current user (for greeting)
 * @param {Array} userAvailability - User's existing availability records
 * @param {Array} groupsAvailability - User's groups and their availability
 * @returns {string} HTML string for complete availability page
 */
export function renderAvailabilityPage(user, userAvailability = [], groupsAvailability = []) {
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
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
  ];

  /**
   * Convert user availability records to grid format for UI
   * @param {number} dayIndex - Index of day (0-6, Sunday–Saturday)
   * @param {string} timeSlot - Time slot (e.g., "9:00 AM")
   * @returns {boolean} True if this time slot is available
   */
  const isTimeSlotAvailable = (dayIndex, timeSlot) => {
    // Convert display time to 24h format
    const time24h = convertToTime24h(timeSlot);
    
    return userAvailability.some(avail => {
      if (avail.dayOfWeek !== dayIndex) return false;
      return time24h >= avail.startTime && time24h < avail.endTime;
    });
  };

  /**
   * Convert 12h time format to 24h format
   * @param {string} time12h - Time in 12h format (e.g., "9:00 AM")
   * @returns {string} Time in 24h format (e.g., "09:00")
   */
  const convertToTime24h = (time12h) => {
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

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
        .map((time) => {
          const cells = days
            .map((_, dayIdx) => {
              const active = isTimeSlotAvailable(dayIdx, time);
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
                  data-time24h="${convertToTime24h(time)}"
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
        <i class="fas fa-calendar"></i>
        <span>My Weekly Availability</span>
      </div>
      <div style="display:flex; align-items: center; gap: var(--space-3);">
        <span class="availability-helper-text">
          Drag or click time blocks to mark when you are free.
        </span>
        <span id="unsaved-changes-indicator" style="display: none; color: var(--color-warn); font-size: var(--text-xs);">
          • Unsaved changes
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
          id="save-availability-btn"
          class="btn btn--primary btn--sm"
          onclick="saveUserAvailability()"
        >
          Save availability
        </button>
      </div>
    </div>
  `;

  const scriptHelpers = `
    <script>
      // Track original state for unsaved changes detection
      let originalState = null;
      let hasUnsavedChanges = false;

      // Initialize original state after page load
      window.initializeAvailabilityState = function() {
        // Validate grid integrity before initializing
        validateGridIntegrity();
        originalState = getCurrentGridState();
        console.log('Initialized availability state:', originalState);
      };
      
      // Validate that all grid cells have proper data attributes
      function validateGridIntegrity() {
        const cells = document.querySelectorAll('.availability-cell--slot');
        let validCells = 0;
        let invalidCells = 0;
        
        cells.forEach(cell => {
          const day = cell.dataset.day;
          const time = cell.dataset.time;
          const time24h = cell.dataset.time24h;
          
          if (day !== undefined && time !== undefined && time24h !== undefined) {
            validCells++;
          } else {
            invalidCells++;
            console.error('Invalid cell found:', {
              element: cell,
              day: day,
              time: time,
              time24h: time24h
            });
          }
        });
        
        console.log('Grid validation: ' + validCells + ' valid cells, ' + invalidCells + ' invalid cells');
        
        if (invalidCells > 0) {
          console.warn('Some cells have missing data attributes. This may cause issues with state management.');
        }
      }

      window.toggleAvailabilityCell = function (cell) {
        if (!cell) return;
        const isActive = cell.classList.toggle("availability-cell--active");
        cell.setAttribute("aria-pressed", isActive ? "true" : "false");
        
        // Check for unsaved changes
        checkForUnsavedChanges();
      };

      window.resetAvailabilityGrid = function () {
        document
          .querySelectorAll(".availability-cell--slot.availability-cell--active")
          .forEach((cell) => {
            cell.classList.remove("availability-cell--active");
            cell.setAttribute("aria-pressed", "false");
          });
        
        checkForUnsavedChanges();
      };

      // Get current grid state as object {dayOfWeek: [timeSlots]}
      function getCurrentGridState() {
        const state = {};
        for (let day = 0; day <= 6; day++) {
          state[day] = [];
        }

        document.querySelectorAll(".availability-cell--slot.availability-cell--active").forEach(cell => {
          const day = parseInt(cell.dataset.day);
          const time24h = cell.dataset.time24h;
          
          // Validation and error handling
          if (isNaN(day) || day < 0 || day > 6) {
            console.error('Invalid day value:', day, 'for cell:', cell);
            return;
          }
          
          if (!time24h || time24h === 'undefined') {
            console.error('Missing or invalid time24h attribute for cell:', cell);
            console.error('Cell attributes:', {
              day: cell.dataset.day,
              time: cell.dataset.time,
              time24h: cell.dataset.time24h,
              classes: cell.className
            });
            return;
          }
          
          if (!state[day]) state[day] = [];
          state[day].push(time24h);
        });

        // Debug log final state
        console.log('Current grid state:', state);
        return state;
      }

      // Check if current state differs from original
      function checkForUnsavedChanges() {
        const currentState = getCurrentGridState();
        hasUnsavedChanges = JSON.stringify(originalState) !== JSON.stringify(currentState);
        
        const indicator = document.getElementById('unsaved-changes-indicator');
        if (indicator) {
          indicator.style.display = hasUnsavedChanges ? 'inline' : 'none';
        }
      }

      // Convert grid state to time ranges for API
      function convertGridToRanges(gridState) {
        const ranges = [];
        
        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
          const daySlots = (gridState[dayOfWeek] || [])
            .filter(slot => slot && slot !== 'undefined') // Filter out invalid slots
            .sort();
          if (daySlots.length === 0) continue;

          console.log('Processing day', dayOfWeek, 'slots:', daySlots); // Debug

          // Group consecutive slots into ranges
          let rangeStart = null;
          let lastSlot = null;

          for (const slot of daySlots) {
            if (rangeStart === null) {
              rangeStart = slot;
            } else {
              // Check if there's a gap (more than 30 minutes)
              try {
                const lastTime = new Date('2000-01-01 ' + lastSlot);
                const currentTime = new Date('2000-01-01 ' + slot);
                const diff = (currentTime - lastTime) / (1000 * 60); // minutes

                if (diff > 30) {
                  // Gap found, close current range and start new one
                  const endTime = addMinutes(lastSlot, 30);
                  ranges.push({
                    dayOfWeek,
                    startTime: rangeStart,
                    endTime: endTime
                  });
                  console.log('Added range:', { dayOfWeek, startTime: rangeStart, endTime }); // Debug
                  rangeStart = slot;
                }
              } catch (error) {
                console.error('Error processing time slots:', error, 'lastSlot:', lastSlot, 'slot:', slot);
              }
            }
            lastSlot = slot;
          }

          // Close final range
          if (rangeStart !== null && lastSlot !== null) {
            const endTime = addMinutes(lastSlot, 30);
            ranges.push({
              dayOfWeek,
              startTime: rangeStart,
              endTime: endTime
            });
            console.log('Added final range:', { dayOfWeek, startTime: rangeStart, endTime }); // Debug
          }
        }

        console.log('Final ranges:', ranges); // Debug
        return ranges;
      }

      // Helper to add minutes to time string
      function addMinutes(timeStr, minutes) {
        if (!timeStr) {
          console.error('addMinutes called with undefined timeStr');
          return '20:00'; // fallback to 8 PM
        }
        const [hours, mins] = timeStr.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return newHours.toString().padStart(2, '0') + ':' + newMins.toString().padStart(2, '0');
      }

      // Debug function to help troubleshoot availability grid issues
      // Function to update group availability sections in real-time
      window.updateGroupAvailabilitySections = function() {
        const groupContainer = document.getElementById('group-availability-sections');
        if (!groupContainer) {
          console.warn('Group availability sections container not found');
          return;
        }

        console.log('Updating group availability sections...');
        
        // Show loading indicator
        groupContainer.classList.add('loading');
        
        // Fetch updated group data
        fetch('/availability/groups', {
          method: 'GET',
          headers: {
            'HX-Request': 'true'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch updated group availability');
          }
          return response.text();
        })
        .then(html => {
          // Store currently expanded groups to restore state
          const expandedGroups = JSON.parse(localStorage.getItem('expandedGroups') || '[]');
          
          // Update content
          groupContainer.outerHTML = html;
          
          // Restore expanded state after a brief delay to ensure DOM is updated
          setTimeout(() => {
            if (window.initializeGroupStates) {
              window.initializeGroupStates();
            }
            console.log('Group availability sections updated successfully');
          }, 50);
        })
        .catch(error => {
          console.error('Failed to update group availability:', error);
          if (window.showToast) {
            window.showToast("Update failed", "Could not refresh group availability. Please reload the page.", "warn");
          }
        })
        .finally(() => {
          // Remove loading state
          const newContainer = document.getElementById('group-availability-sections');
          if (newContainer) {
            newContainer.classList.remove('loading');
          }
        });
      };

      // Debug function to help troubleshoot availability grid issues
      window.debugAvailabilityGrid = function() {
        console.group('Availability Grid Debug Information');
        
        // Check if grid exists
        const grid = document.querySelector('.availability-grid');
        console.log('Grid element exists:', !!grid);
        
        // Count total cells
        const allCells = document.querySelectorAll('.availability-cell--slot');
        console.log('Total slot cells:', allCells.length);
        
        // Count active cells
        const activeCells = document.querySelectorAll('.availability-cell--slot.availability-cell--active');
        console.log('Active cells:', activeCells.length);
        
        // Validate data attributes
        let validCells = 0;
        let problematicCells = [];
        
        allCells.forEach((cell, index) => {
          const day = cell.dataset.day;
          const time = cell.dataset.time;
          const time24h = cell.dataset.time24h;
          
          if (day !== undefined && time !== undefined && time24h !== undefined) {
            validCells++;
          } else {
            problematicCells.push({
              index: index,
              day: day,
              time: time,
              time24h: time24h,
              element: cell
            });
          }
        });
        
        console.log('Valid cells:', validCells);
        console.log('Problematic cells:', problematicCells.length);
        
        if (problematicCells.length > 0) {
          console.table(problematicCells);
        }
        
        // Show current state
        console.log('Current grid state:', getCurrentGridState());
        console.log('Original state:', originalState);
        console.log('Has unsaved changes:', hasUnsavedChanges);
        
        console.groupEnd();
      };

      window.saveUserAvailability = function () {
        if (!hasUnsavedChanges) {
          if (window.showToast) {
            window.showToast("No changes", "Your availability is already saved.", "info");
          }
          return;
        }

        const gridState = getCurrentGridState();
        const ranges = convertGridToRanges(gridState);
        const saveBtn = document.getElementById('save-availability-btn');
        
        console.log('Saving availability:', ranges); // Debug log
        
        if (saveBtn) saveBtn.textContent = 'Saving...';

        // Use fetch instead of htmx.ajax for more reliable POST request
        fetch('/availability/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'HX-Request': 'true'
          },
          body: 'availability=' + encodeURIComponent(JSON.stringify(ranges))
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
          }
          return response.text();
        })
        .then(() => {
          // Success - update original state
          originalState = gridState;
          hasUnsavedChanges = false;
          const indicator = document.getElementById('unsaved-changes-indicator');
          if (indicator) indicator.style.display = 'none';
          
          console.log('Availability saved successfully'); // Debug log
          
          // Update group availability sections in real-time
          updateGroupAvailabilitySections();
          
          if (window.showToast) {
            window.showToast("Availability saved", "Your weekly availability has been updated.", "success");
          }
        })
        .catch(error => {
          console.error('Save failed:', error); // Debug log
          if (window.showToast) {
            window.showToast("Save failed", "Could not save your availability. Please try again.", "error");
          }
        })
        .finally(() => {
          if (saveBtn) saveBtn.textContent = 'Save availability';
        });
      };

      // Initialize when page loads with robust timing
      function ensureInitialization() {
        const gridExists = document.querySelector('.availability-grid');
        const cellsExist = document.querySelectorAll('.availability-cell--slot').length > 0;
        
        if (gridExists && cellsExist) {
          console.log('Initializing availability state - grid ready');
          initializeAvailabilityState();
        } else {
          console.log('Grid not ready, retrying in 100ms...');
          setTimeout(ensureInitialization, 100);
        }
      }
      
      // Try immediate initialization first, then fallback
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureInitialization);
      } else {
        ensureInitialization();
      }
    </script>
  `;

  // Group availability sections
  const groupSections = renderGroupAvailabilitySections(groupsAvailability);

  const groupAvailabilityScripts = groupsAvailability.length > 0 ? `
    <script>
      // Group availability toggle functionality
      window.toggleGroupAvailability = function(groupId) {
        const content = document.getElementById('group-' + groupId + '-content');
        const toggle = document.querySelector('[data-group-id="' + groupId + '"] .group-availability-toggle');
        const icon = toggle.querySelector('i');
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          toggle.setAttribute('aria-expanded', 'true');
          icon.className = 'fas fa-chevron-down';
          
          // Save expanded state
          const expandedGroups = JSON.parse(localStorage.getItem('expandedGroups') || '[]');
          if (!expandedGroups.includes(groupId)) {
            expandedGroups.push(groupId);
            localStorage.setItem('expandedGroups', JSON.stringify(expandedGroups));
          }
        } else {
          content.style.display = 'none';
          toggle.setAttribute('aria-expanded', 'false');
          icon.className = 'fas fa-chevron-up';
          
          // Save collapsed state
          const expandedGroups = JSON.parse(localStorage.getItem('expandedGroups') || '[]');
          const index = expandedGroups.indexOf(groupId);
          if (index > -1) {
            expandedGroups.splice(index, 1);
            localStorage.setItem('expandedGroups', JSON.stringify(expandedGroups));
          }
        }
      };

      // Initialize group states from localStorage
      window.initializeGroupStates = function() {
        const expandedGroups = JSON.parse(localStorage.getItem('expandedGroups') || '[]');
        expandedGroups.forEach(groupId => {
          const content = document.getElementById('group-' + groupId + '-content');
          const toggle = document.querySelector('[data-group-id="' + groupId + '"] .group-availability-toggle');
          if (content && toggle) {
            content.style.display = 'block';
            toggle.setAttribute('aria-expanded', 'true');
            const icon = toggle.querySelector('i');
            if (icon) icon.className = 'fas fa-chevron-down';
          }
        });
      };

      // Initialize group states after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGroupStates);
      } else {
        initializeGroupStates();
      }
    </script>
  ` : '';

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
    ${groupSections}
    ${scriptHelpers}
    ${groupAvailabilityScripts}
  `;
}
