// =============================
//  Groups Controller (HTMX + JSON API)
// =============================

import {
  createBaseLayout,
  escapeHtml,
} from "../utils/html-templates.js";
import { asyncHandler } from "../utils/async-handler.js";
import { 
  getUserAvailability, 
  addUserAvailability, 
  deleteUserAvailability,
  isValidTime,
  isValidDayOfWeek,
  TIME_SLOTS,
  getGroupAvailability
} from "../services/availability.service.js";
import { prisma } from "../lib/prisma.js";

/**
 * Render Groups Dashboard (HTMX)
 * Main dashboard view showing personal availability and team calendars
 */
export const renderGroupsDashboard = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).send("Authentication required");
  }

  // Load user's availability from database
  const userAvailabilityRecords = await getUserAvailability(userId);
  
  // Load user's groups
  const userGroups = await getUserGroups(userId);
  
  const content = renderGroupsDashboardHTML(req.user, userAvailabilityRecords, userGroups);

  // Check if this is an HTMX request or direct browser navigation
  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    // HTMX request: return HTML fragment for dynamic content swap
    res.send(content);
  } else {
    // Direct navigation: return full HTML page with styles and layout
    const fullPage = createBaseLayout("My Groups Dashboard", content);
    res.send(fullPage);
  }
});

/**
 * Update User Availability (HTMX API)
 * Handle personal availability changes via HTMX
 */
export const updateUserAvailability = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { availability } = req.body;

  // Validate availability format
  if (!Array.isArray(availability)) {
    return res.status(400).json({ error: "Invalid availability format" });
  }

  // Validate each availability slot
  for (const slot of availability) {
    if (typeof slot.day !== 'number' || slot.day < 0 || slot.day > 6) {
      return res.status(400).json({ error: "Invalid day value (must be 0-6)" });
    }
    if (!slot.time || !/^\d{2}:\d{2}$/.test(slot.time)) {
      return res.status(400).json({ error: "Invalid time format (must be HH:MM)" });
    }
    if (typeof slot.available !== 'boolean') {
      return res.status(400).json({ error: "Invalid available value (must be boolean)" });
    }
  }

  try {
    // Delete all existing availability for this user first
    const existingAvailability = await getUserAvailability(userId);
    for (const record of existingAvailability) {
      await deleteUserAvailability(record.id, userId);
    }

    // Convert individual time slots to time ranges and save to database
    const availableSlots = availability.filter(slot => slot.available);
    const timeRanges = convertSlotsToRanges(availableSlots);
    
    // Save each time range to database
    for (const range of timeRanges) {
      await addUserAvailability(userId, range.dayOfWeek, range.startTime, range.endTime);
    }


    const timestamp = new Date().toLocaleString();
    const availableCount = availability.filter(s => s.available).length;
    const totalSlots = availability.length;
    
    const successHTML = `
      <div class="availability-status availability-status--saved">
        <i class="status-icon fas fa-check-circle"></i>
        <span>Availability updated successfully! ${availableCount} of ${totalSlots} time slots set as available.</span>
        <small class="status-timestamp">Last updated: ${timestamp}</small>
      </div>
    `;
    res.send(successHTML);

  } catch (error) {
    console.error("Error updating availability:", error);
    const errorHTML = `
      <div class="availability-status availability-status--error">
        <i class="status-icon fas fa-exclamation-triangle"></i>
        <span>Failed to update availability. Please try again.</span>
        <small class="status-error-details">${error.message}</small>
      </div>
    `;
    res.status(500).send(errorHTML);
  }
});

/**
 * Get Teams Data (JSON API)
 * Return JSON data for team availability and information
 */
export const getTeamsData = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // TODO: Implement database queries for teams data
    const teamsData = {
      teams: [],
      totalTeams: 0,
      totalMembers: 0,
      upcomingEvents: []
    };
    res.json(teamsData);
  } catch (error) {
    console.error("Error fetching teams data:", error);
    res.status(500).json({ error: "Failed to fetch teams data" });
  }
});

/**
 * Get Team Availability (HTMX API)
 * Return updated team availability HTML for specific team
 */
export const getTeamAvailability = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const teamId = req.params.teamId;

  console.log(`[getTeamAvailability] userId: ${userId}, teamId: ${teamId}`);

  if (!userId) {
    return res.status(401).send("Authentication required");
  }

  try {
    // Verify user is part of this group
    const userGroupRole = await prisma.groupRole.findFirst({
      where: { 
        userId,
        groupId: teamId 
      }
    });

    console.log(`[getTeamAvailability] userGroupRole:`, userGroupRole);

    if (!userGroupRole) {
      return res.status(403).send("Access denied");
    }

    // Get group availability density data
    console.log(`[getTeamAvailability] Fetching group availability for groupId: ${teamId}`);
    const groupAvailabilityData = await getGroupAvailability(teamId);
    console.log(`[getTeamAvailability] Group data:`, JSON.stringify(groupAvailabilityData, null, 2));
    
    // Render group calendar HTML
    const calendarHTML = renderGroupCalendarGrid(groupAvailabilityData);
    console.log(`[getTeamAvailability] Sending calendar HTML length: ${calendarHTML.length}`);
    res.send(calendarHTML);

  } catch (error) {
    console.error("Error fetching team availability:", error);
    const errorHTML = `
      <div class="dashboard-error">
        <i class="error-icon fas fa-exclamation-triangle"></i>
        <h4 class="error-title">Unable to Load Team Data</h4>
        <p class="error-message">${escapeHtml(error.message)}</p>
        <small>Error details: ${escapeHtml(error.stack)}</small>
      </div>
    `;
    res.status(500).send(errorHTML);
  }
});

// =============================
// Database Helper Functions
// =============================

/**
 * Get user's groups with basic information
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's groups with roles
 */
async function getUserGroups(userId) {
  return await prisma.groupRole.findMany({
    where: { userId },
    include: {
      group: true
    },
    orderBy: {
      group: { name: 'asc' }
    }
  });
}

// =============================
// HTML Rendering Functions
// =============================

/**
 * Render complete groups dashboard HTML
 * @param {Object} user - User data
 * @param {Array} userAvailability - User's stored availability data
 * @param {Array} userGroups - User's groups with roles
 * @returns {string} HTML string
 */
function renderGroupsDashboardHTML(user, userAvailability = [], userGroups = []) {
  return `
    <div class="container">
      <div class="groups-dashboard">
        <div class="dashboard-header">
          <h1 class="dashboard-title">
            <i class="fas fa-users" aria-hidden="true"></i>
            My Groups Dashboard
          </h1>
          <p class="dashboard-subtitle">
            Welcome ${escapeHtml(user.name || 'Student')}! Manage your availability and coordinate with your teams.
          </p>
        </div>

        <div class="dashboard-section availability-planning-section">
          <div class="section-header section-header--personal">
            <h2 class="section-title">
              <i class="fas fa-calendar-check" aria-hidden="true"></i>
              Availability Planning
            </h2>
            <p class="section-subtitle">Set your availability</p>
          </div>
          <div class="section-content">
            <!-- Status Display -->
            <div id="availability-status"></div>
            
            <div class="personal-calendar-container">
              <div class="personal-calendar-header">
                <div class="calendar-header-main">
                  <h3 class="calendar-title">My Availability</h3>
                  <div class="edit-mode-toggle">
                    <label class="toggle-switch">
                      <input type="checkbox" id="edit-mode-toggle" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Edit</span>
                  </div>
                </div>
              </div>
              
              <div class="calendar-grid" id="personal-calendar">
                ${renderPersonalCalendarGrid(userAvailability)}
              </div>
              
              <div class="personal-legend">
                <div class="legend-items">
                  <div class="legend-item">
                    <div class="legend-color legend-color--available"></div>
                    <span>Available</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color legend-color--unavailable"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-section teams-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-users" aria-hidden="true"></i>
              My Teams (${userGroups.length})
            </h2>
            <p class="section-subtitle">${userGroups.length > 0 ? 'Team availability density maps' : 'No teams found. Join a team to see availability coordination features.'}</p>
          </div>
          <div class="section-content">
            ${userGroups.length > 0 ? renderGroupsCalendars(userGroups) : renderEmptyTeamsState()}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render personal calendar grid with 30-minute time slots
 * @param {Array} userAvailability - User's stored availability data
 * @returns {string} HTML string
 */
function renderPersonalCalendarGrid(userAvailability = []) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = generateTimeSlots();
  
  // Generate header row
  const headerRow = `
    <div class="calendar-row calendar-header">
      <div class="time-label-header">Time</div>
      ${days.map(day => `
        <div class="day-header">${day}</div>
      `).join('')}
    </div>
  `;
  
  // Convert database ranges to individual time slots for display
  const availabilityMap = convertRangesToSlots(userAvailability);

  // Generate time slot rows
  const timeRows = timeSlots.map(time => `
    <div class="calendar-row time-row" data-time="${time}">
      <div class="time-label">${formatTime(time)}</div>
      ${days.map((day, dayIndex) => {
        const slotKey = `${dayIndex}-${time}`;
        const isAvailable = availabilityMap.get(slotKey) || false;
        const slotClass = isAvailable ? 'time-slot--available' : 'time-slot--unavailable';
        const status = isAvailable ? 'Available' : 'Unavailable';
        const pressed = isAvailable ? 'true' : 'false';
        
        return `
        <div class="time-slot ${slotClass}" 
             data-day="${dayIndex}" 
             data-time="${time}"
             role="button"
             tabindex="0"
             aria-label="${status}: ${day} at ${formatTime(time)}"
             aria-pressed="${pressed}"
             title="${day} at ${formatTime(time)} - Click to toggle availability">
        </div>
        `;
      }).join('')}
    </div>
  `).join('');
  
  return `
    <div class="weekly-calendar">
      ${headerRow}
      ${timeRows}
    </div>
  `;
}

/**
 * Generate time slots for calendar (8:00 AM to 11:30 PM in 30-minute intervals)
 * @returns {Array} Time slot strings in 24-hour format
 */
function generateTimeSlots() {
  const slots = [];
  for (let hour = 8; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

/**
 * Format 24-hour time to 12-hour format for display
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time string
 */
function formatTime(time) {
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Convert individual time slots to continuous time ranges
 * @param {Array} availableSlots - Array of {day, time, available} objects
 * @returns {Array} Array of {dayOfWeek, startTime, endTime} ranges
 */
function convertSlotsToRanges(availableSlots) {
  const ranges = [];
  
  // Group slots by day
  const slotsByDay = {};
  for (const slot of availableSlots) {
    if (!slotsByDay[slot.day]) {
      slotsByDay[slot.day] = [];
    }
    slotsByDay[slot.day].push(slot.time);
  }
  
  // Convert each day's slots to ranges
  for (const [day, times] of Object.entries(slotsByDay)) {
    const sortedTimes = times.sort();
    
    let rangeStart = sortedTimes[0];
    let rangeEnd = addThirtyMinutes(rangeStart);
    
    for (let i = 1; i < sortedTimes.length; i++) {
      const currentTime = sortedTimes[i];
      
      // If this time is continuous with the current range, extend the range
      if (currentTime === rangeEnd) {
        rangeEnd = addThirtyMinutes(currentTime);
      } else {
        // Gap found, save current range and start new one
        ranges.push({
          dayOfWeek: parseInt(day),
          startTime: rangeStart,
          endTime: rangeEnd
        });
        
        rangeStart = currentTime;
        rangeEnd = addThirtyMinutes(currentTime);
      }
    }
    
    // Save the final range for this day
    ranges.push({
      dayOfWeek: parseInt(day),
      startTime: rangeStart,
      endTime: rangeEnd
    });
  }
  
  return ranges;
}

/**
 * Add 30 minutes to a time string
 * @param {string} time - Time in HH:MM format
 * @returns {string} Time + 30 minutes
 */
function addThirtyMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  let newMinutes = minutes + 30;
  let newHours = hours;
  
  if (newMinutes >= 60) {
    newMinutes = 0;
    newHours += 1;
  }
  
  // Handle midnight rollover
  if (newHours >= 24) {
    newHours = 0;
  }
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

/**
 * Convert database availability ranges to individual time slots for display
 * @param {Array} availabilityRecords - Database records with dayOfWeek, startTime, endTime
 * @returns {Map} Map of "day-time" => boolean for quick lookup
 */
function convertRangesToSlots(availabilityRecords) {
  const slotMap = new Map();
  
  availabilityRecords.forEach(record => {
    const startIndex = TIME_SLOTS.indexOf(record.startTime);
    const endIndex = TIME_SLOTS.indexOf(record.endTime);
    
    if (startIndex !== -1 && endIndex !== -1) {
      for (let i = startIndex; i < endIndex; i++) {
        const timeSlot = TIME_SLOTS[i];
        slotMap.set(`${record.dayOfWeek}-${timeSlot}`, true);
      }
    }
  });
  
  return slotMap;
}

/**
 * Render multiple group calendars with density visualization
 * @param {Array} userGroups - User's groups with roles
 * @returns {string} HTML string
 */
function renderGroupsCalendars(userGroups) {
  return `
    <div class="groups-calendars">
      ${userGroups.map(groupRole => `
        <div class="group-calendar-card">
          <div class="group-header">
            <h3 class="group-name">${escapeHtml(groupRole.group.name)}</h3>
            <span class="group-role">${escapeHtml(groupRole.role)}</span>
          </div>
          <div class="group-calendar-container" id="group-calendar-${groupRole.group.id}">
            <div class="calendar-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading group availability...</span>
            </div>
          </div>
          <button class="load-group-calendar-btn" 
                  data-group-id="${groupRole.group.id}">
            <i class="fas fa-calendar-alt"></i>
            Load Availability
          </button>
        </div>
      `).join('')}
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Add event listeners for group calendar buttons
        document.addEventListener('click', function(event) {
          if (event.target.closest('.load-group-calendar-btn')) {
            const button = event.target.closest('.load-group-calendar-btn');
            const groupId = button.getAttribute('data-group-id');
            if (groupId) {
              loadGroupCalendar(groupId);
            }
          }
        });
        
        function loadGroupCalendar(groupId) {
          console.log('[loadGroupCalendar] Loading calendar for groupId:', groupId);
          
          const container = document.getElementById('group-calendar-' + groupId);
          const button = document.querySelector('[data-group-id="' + groupId + '"]');
          
          if (!container) {
            console.error('[loadGroupCalendar] Container not found:', 'group-calendar-' + groupId);
            return;
          }
          
          if (!button) {
            console.error('[loadGroupCalendar] Button not found for groupId:', groupId);
            return;
          }
          
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
          
          const url = '/groups/team/' + groupId + '/availability';
          console.log('[loadGroupCalendar] Fetching from URL:', url);
          
          fetch(url)
            .then(response => {
              console.log('[loadGroupCalendar] Response status:', response.status);
              console.log('[loadGroupCalendar] Response headers:', response.headers);
              
              if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
              }
              return response.text();
            })
            .then(html => {
              console.log('[loadGroupCalendar] Received HTML length:', html.length);
              console.log('[loadGroupCalendar] HTML preview:', html.substring(0, 200));
              container.innerHTML = html;
              button.style.display = 'none';
            })
            .catch(error => {
              console.error('[loadGroupCalendar] Error loading group calendar:', error);
              container.innerHTML = '<div class="error">Failed to load group availability: ' + error.message + '</div>';
              button.disabled = false;
              button.innerHTML = '<i class="fas fa-calendar-alt"></i> Try Again';
            });
        }
      });
    </script>
  `;
}

/**
 * Render empty teams state
 * @returns {string} HTML string
 */
function renderEmptyTeamsState() {
  return `
    <div class="empty-teams">
      <div class="empty-teams-icon">
        <i class="fas fa-user-plus"></i>
      </div>
      <h3>No Teams Yet</h3>
      <p>You're not part of any teams yet. Once you join teams, you'll see:</p>
      <ul>
        <li>Team availability density maps</li>
        <li>Upcoming team events</li>
        <li>Optimal meeting times</li>
        <li>Team chat and coordination tools</li>
      </ul>
    </div>
  `;
}

/**
 * Render group calendar grid with availability density
 * @param {Object} groupData - Group availability data with density map
 * @returns {string} HTML string
 */
function renderGroupCalendarGrid(groupData) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = generateTimeSlots();
  
  // Generate header row
  const headerRow = `
    <div class="calendar-row calendar-header">
      <div class="time-label-header">Time</div>
      ${days.map(day => `
        <div class="day-header">${day}</div>
      `).join('')}
    </div>
  `;
  
  // Generate time slot rows with density visualization
  const timeRows = timeSlots.map(time => `
    <div class="calendar-row time-row" data-time="${time}">
      <div class="time-label">${formatTime(time)}</div>
      ${days.map((day, dayIndex) => {
        const slotData = groupData.densityMap[dayIndex][time];
        const density = slotData.density;
        const availableCount = slotData.availableCount;
        const totalMembers = groupData.totalMembers;
        
        // Determine density class based on availability percentage
        let densityClass = 'density-none';
        if (density >= 0.8) densityClass = 'density-high';
        else if (density >= 0.6) densityClass = 'density-medium-high';
        else if (density >= 0.4) densityClass = 'density-medium';
        else if (density >= 0.2) densityClass = 'density-low';
        
        const memberNames = slotData.availableMembers.map(m => m.name).join(', ');
        const tooltipText = totalMembers > 0 
          ? `${availableCount}/${totalMembers} available${memberNames ? ': ' + memberNames : ''}`
          : 'No members';
        
        return `
        <div class="time-slot group-slot ${densityClass}" 
             data-day="${dayIndex}" 
             data-time="${time}"
             title="${day} at ${formatTime(time)} - ${tooltipText}"
             data-density="${density.toFixed(2)}"
             data-available-count="${availableCount}"
             data-total-members="${totalMembers}">
          <div class="density-indicator">
            <span class="availability-fraction">${availableCount}/${totalMembers}</span>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  `).join('');
  
  return `
    <div class="group-calendar">
      <div class="group-calendar-header">
        <div class="group-stats">
          <span class="total-members">
            <i class="fas fa-users"></i>
            ${groupData.totalMembers} members
          </span>
        </div>
      </div>
      <div class="weekly-calendar group-calendar-grid">
        ${headerRow}
        ${timeRows}
      </div>
      <div class="group-legend">
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color density-high"></div>
            <span>High (80%+)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color density-medium-high"></div>
            <span>Good (60%+)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color density-medium"></div>
            <span>Medium (40%+)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color density-low"></div>
            <span>Low (20%+)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color density-none"></div>
            <span>None</span>
          </div>
        </div>
      </div>
    </div>
  `;
}