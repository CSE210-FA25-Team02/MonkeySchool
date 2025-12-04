/**
 * Event Controller
 * code/src/controllers/event.controller.js
 *
 * Handles event creation and management
 */

import { asyncHandler } from "../utils/async-handler.js";
import { BadRequestError, NotFoundError } from "../utils/api-error.js";
import * as eventService from "../services/event.service.js";
import * as classService from "../services/class.service.js";
import * as classRoleService from "../services/classRole.service.js";
import { renderSchedulePage, renderScheduleWrapper, renderEventDetailModal, renderEditEventModal } from "../utils/htmx-templates/schedule-templates.js";
import { escapeHtml } from "../utils/html-templates.js";
import { prisma } from "../lib/prisma.js";

/**
 * Map UI event type to database EventType enum
 * Note: UI now uses DB enum values directly, so this is mainly for backward compatibility
 * @param {string} uiType - UI event type string (should already be DB enum value)
 * @returns {string} Database EventType enum value
 */
function mapUITypeToDB(uiType) {
  // UI now uses DB enum values directly, but validate and return as-is
  const validTypes = [
    "COURSE_LECTURE",
    "COURSE_OFFICE_HOUR",
    "COURSE_DISCUSSION",
    "GROUP_MEETING",
    "OTHER",
  ];
  if (validTypes.includes(uiType)) {
    return uiType;
  }
  // Fallback for old values (shouldn't happen, but for safety)
  const typeMap = {
    lecture: "COURSE_LECTURE",
    "office-hours": "COURSE_OFFICE_HOUR",
    discussion: "COURSE_DISCUSSION",
    meeting: "GROUP_MEETING",
    other: "OTHER",
  };
  return typeMap[uiType] || "OTHER";
}

/**
 * Convert date and time strings to PST DateTime (stored as UTC in DB)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {Date} Date object representing the PST time (stored as UTC)
 */
function convertToPST(dateStr, timeStr) {
  // Parse date and time components
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Create a date string in the format: YYYY-MM-DDTHH:MM:00
  const dateTimeStr = `${dateStr}T${timeStr}:00`;

  // Create a date object assuming this is a PST time
  // We'll use a library-free approach: create the date and manually account for PST offset
  // PST is UTC-8, PDT (daylight saving) is UTC-7

  // Create a date object for this specific date/time
  const testDate = new Date(year, month - 1, day, hours, minutes, 0);

  // Get what this date/time would be in PST timezone
  // We'll create a date in UTC that represents this PST time
  // Method: Create date in UTC, then check what it would be in PST, and adjust

  // Simpler approach: Create date string with PST offset and parse
  // First, try with PST offset (-08:00)
  let dateWithOffset = new Date(`${dateTimeStr}-08:00`);

  // Check if DST is in effect by comparing with a known DST period
  // DST in US Pacific: 2nd Sunday in March to 1st Sunday in November
  const dateObj = new Date(year, month - 1, day);
  const march = new Date(year, 2, 1); // March 1
  const november = new Date(year, 10, 1); // November 1

  // Find 2nd Sunday in March
  const marchDay = march.getDay();
  const secondSundayMarch = 14 - marchDay; // Days to add to get to 2nd Sunday

  // Find 1st Sunday in November
  const novDay = november.getDay();
  const firstSundayNov = 7 - novDay; // Days to add to get to 1st Sunday

  const dstStart = new Date(year, 2, secondSundayMarch);
  const dstEnd = new Date(year, 10, firstSundayNov);

  const isDST = dateObj >= dstStart && dateObj < dstEnd;

  // Use appropriate offset: -07:00 for PDT, -08:00 for PST
  const offset = isDST ? "-07:00" : "-08:00";
  dateWithOffset = new Date(`${dateTimeStr}${offset}`);

  return dateWithOffset;
}

/**
 * Create a new event
 * Route: POST /events/create
 * Auth: requireAuth
 */
export const createEvent = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError("Authentication required");
  }

  const {
    title,
    type,
    date,
    startTime,
    endTime,
    location,
    classId,
    group,
  } = req.body;

  // Validate required fields
  if (!title || !type || !date || !startTime || !endTime || !classId) {
    throw new BadRequestError(
      "Missing required fields: title, type, date, startTime, endTime, classId",
    );
  }

  // Validate class exists
  const klass = await classService.getClassById(classId);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Map UI type to DB type (UI now uses DB enum values directly)
  const dbType = mapUITypeToDB(type);

  // Validate group for GROUP_MEETING events
  let groupId = null;
  if (dbType === "GROUP_MEETING") {
    if (!group || group.trim() === "") {
      const errorHtml = `
        <div id="event-form-errors">
          <div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);">
            <strong>Error:</strong> Group is required for group meetings.
          </div>
        </div>
        <script>
          if (window.showToast) {
            window.showToast('Validation Error', 'Group is required for group meetings', 'error');
          }
        </script>
      `;
      return res.status(400).send(errorHtml);
    }

    // Validate that the group exists and belongs to this class
    const groupRecord = await prisma.group.findFirst({
      where: {
        id: group,
        classId,
      },
    });

    if (!groupRecord) {
      const errorHtml = `
        <div id="event-form-errors">
          <div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);">
            <strong>Error:</strong> Invalid group selected. Please select a valid group.
          </div>
        </div>
        <script>
          if (window.showToast) {
            window.showToast('Validation Error', 'Invalid group selected', 'error');
          }
        </script>
      `;
      return res.status(400).send(errorHtml);
    }

    groupId = group;
  }

  // Validate endTime > startTime
  const startDateTime = convertToPST(date, startTime);
  const endDateTime = convertToPST(date, endTime);

  if (endDateTime <= startDateTime) {
    // Return form with error for HTMX
    const errorHtml = `
      <div id="event-form-errors">
        <div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);">
          <strong>Error:</strong> End time must be later than start time.
        </div>
      </div>
      <script>
        if (window.showToast) {
          window.showToast('Validation Error', 'End time must be later than start time', 'error');
        }
      </script>
    `;
    return res.status(400).send(errorHtml);
  }

  // Validate date is not in the past (PST)
  const pstNow = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const todayPST = new Date(pstNow);
  todayPST.setHours(0, 0, 0, 0);

  const eventDate = new Date(date + "T00:00:00");
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate < todayPST) {
    const errorHtml = `
      <div id="event-form-errors">
        <div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);">
          <strong>Error:</strong> Cannot create events for past dates.
        </div>
      </div>
      <script>
        if (window.showToast) {
          window.showToast('Validation Error', 'Cannot create events for past dates', 'error');
        }
      </script>
    `;
    return res.status(400).send(errorHtml);
  }

  // Create event
  try {
    await eventService.createEvent({
      title,
      type: dbType,
      startTime: startDateTime,
      endTime: endDateTime,
      location: location || null,
      classId,
      groupId, // Will be null for non-group events
      userId,
      isRecurring: false,
      recurrencePattern: null,
    });

    // Get current view and date from query params or use defaults
    const view = req.query.view || "week";
    const dateParam = req.query.date || date;
    const currentDate = new Date(dateParam);

    // Fetch updated events for the week
    const weekStart = new Date(currentDate);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Fetch all groups for this class (for dropdown)
    const groupsForClass = await prisma.group.findMany({
      where: { classId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Get user's class role for event filtering and allowed types
    let userClassRole = null;
    let allowedEventTypes = [];
    let isGroupLeader = false;
    let leaderGroupId = null;

    if (userId) {
      // Get user's class role
      const classRole = await classRoleService.getClassRole(userId, classId);
      userClassRole = classRole?.role || null;

      const groupIds = groupsForClass.map((g) => g.id);

      // Check if user is a group leader and which group they lead
      if (groupIds.length > 0) {
        const leaderRecord = await prisma.groupRole.findFirst({
          where: {
            userId,
            role: "LEADER",
            groupId: { in: groupIds },
          },
          select: { groupId: true },
        });
        if (leaderRecord) {
          isGroupLeader = true;
          leaderGroupId = leaderRecord.groupId;
        }
      }

      // Determine allowed event types based on role (using DB enum values)
      // Professor, TA, Tutor, and Group Leader can all create GROUP_MEETING
      if (userClassRole === "PROFESSOR" || userClassRole === "TA") {
        allowedEventTypes = [
          "COURSE_LECTURE",
          "COURSE_OFFICE_HOUR",
          "COURSE_DISCUSSION",
          "GROUP_MEETING",
          "OTHER",
        ];
      } else if (userClassRole === "TUTOR") {
        allowedEventTypes = [
          "COURSE_OFFICE_HOUR",
          "COURSE_DISCUSSION",
          "GROUP_MEETING",
          "OTHER",
        ];
      } else if (isGroupLeader) {
        // Group leaders (who are not Professor/TA/Tutor) can only create group meetings
        allowedEventTypes = ["GROUP_MEETING"];
      }
    }

    // Prepare groups data for the modal
    const groupsData = {
      allGroups: groupsForClass,
      isGroupLeader,
      leaderGroupId,
    };

    // Fetch events (filtered by group for students)
    const events = await eventService.getEventsByClassIdAndDateRange(
      classId,
      weekStart,
      weekEnd,
      userId,
      userClassRole,
    );

    // Render updated schedule wrapper (for HTMX targeting)
    const scheduleWrapper = renderScheduleWrapper(
      klass,
      view,
      currentDate,
      events,
      allowedEventTypes,
      groupsData,
    );

    // Return HTML fragment that replaces the target element and closes modal
    return res.send(`
      ${scheduleWrapper}
      <script>
        if (window.closeModal) {
          window.closeModal('modal-create-event');
        }
        if (window.showToast) {
          window.showToast('Success', 'Event created successfully', 'success');
        }
      </script>
    `);
  } catch (error) {
    // Handle permission errors and other service errors
    const errorHtml = `
      <div id="event-form-errors">
        <div class="alert alert--error" role="alert" style="margin-bottom: var(--space-4);">
          <strong>Error:</strong> ${escapeHtml(error.message || "Failed to create event")}
        </div>
      </div>
      <script>
        if (window.showToast) {
          window.showToast('Error', '${escapeHtml(error.message || "Failed to create event")}', 'error');
        }
      </script>
    `;
    return res.status(400).send(errorHtml);
  }
});

/**
 * Get event by ID (for modal display)
 * Route: GET /events/:id
 * Auth: requireAuth
 */
export const getEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Fetch event with related data
  const event = await eventService.getEventById(id);
  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Fetch class info
  const klass = await classService.getClassById(event.classId);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Get user's permissions for this event
  const userClassRole = await classRoleService.getClassRole(userId, event.classId);
  const isGroupLeader = event.groupId ? await prisma.groupRole.findFirst({
    where: {
      userId,
      groupId: event.groupId,
      role: "LEADER",
    },
  }) : false;

  // Determine allowed event types for editing
  const allowedEventTypes = [];
  if (userClassRole) {
    const classRoleType = userClassRole.role;
    if (classRoleType === "PROFESSOR" || classRoleType === "TA") {
      allowedEventTypes.push("COURSE_LECTURE", "COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (classRoleType === "TUTOR") {
      allowedEventTypes.push("COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (isGroupLeader) {
      allowedEventTypes.push("GROUP_MEETING", "OTHER");
    } else {
      allowedEventTypes.push("OTHER");
    }
  } else if (isGroupLeader) {
    allowedEventTypes.push("GROUP_MEETING", "OTHER");
  }

  // Render event detail modal
  const modalHtml = renderEventDetailModal(event, klass, allowedEventTypes, {});

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    res.send(modalHtml);
  } else {
    // For non-HTMX requests, return JSON
    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      classId: event.classId,
      groupId: event.groupId,
      userId: event.userId,
    });
  }
});

/**
 * Get event edit form
 * Route: GET /events/:id/edit
 * Auth: requireAuth
 */
export const getEventEditForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Fetch event with related data
  const event = await eventService.getEventById(id);
  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Fetch class info
  const klass = await classService.getClassById(event.classId);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Check permissions - use canUserModifyEvent for edit operations
  const canEdit = await eventService.canUserModifyEvent(userId, id);
  if (!canEdit) {
    throw new BadRequestError("You do not have permission to edit this event");
  }

  // Get user's permissions for this event
  const userClassRole = await classRoleService.getClassRole(userId, event.classId);
  const isGroupLeader = event.groupId ? await prisma.groupRole.findFirst({
    where: {
      userId,
      groupId: event.groupId,
      role: "LEADER",
    },
  }) : false;

  // Determine allowed event types for editing
  const allowedEventTypes = [];
  if (userClassRole) {
    const classRoleType = userClassRole.role;
    if (classRoleType === "PROFESSOR" || classRoleType === "TA") {
      allowedEventTypes.push("COURSE_LECTURE", "COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (classRoleType === "TUTOR") {
      allowedEventTypes.push("COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (isGroupLeader) {
      allowedEventTypes.push("GROUP_MEETING", "OTHER");
    } else {
      allowedEventTypes.push("OTHER");
    }
  } else if (isGroupLeader) {
    allowedEventTypes.push("GROUP_MEETING", "OTHER");
  }

  // Fetch groups for the class
  const groupsForClass = await prisma.group.findMany({
    where: { classId: event.classId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const groupsData = {
    allGroups: groupsForClass,
    isGroupLeader,
    leaderGroupId: isGroupLeader ? event.groupId : null,
  };

  // Render edit event modal
  const modalHtml = renderEditEventModal(event, klass, allowedEventTypes, groupsData);

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    res.send(modalHtml);
  } else {
    // For non-HTMX requests, return JSON
    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      classId: event.classId,
      groupId: event.groupId,
    });
  }
});

/**
 * Update event
 * Route: PUT /events/:id
 * Auth: requireAuth
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Fetch existing event
  const existingEvent = await eventService.getEventById(id);
  if (!existingEvent) {
    throw new NotFoundError("Event not found");
  }

  // Check permissions - use canUserModifyEvent for edit/delete operations
  const canEdit = await eventService.canUserModifyEvent(userId, id);
  if (!canEdit) {
    throw new BadRequestError("You do not have permission to edit this event");
  }

  // Parse request body
  const { title, description, location, type, date, startTime, endTime, group } = req.body;

  // Validate required fields
  if (!title || !type || !date || !startTime || !endTime) {
    throw new BadRequestError("Title, type, date, start time, and end time are required");
  }

  // Validate event type
  const validTypes = ["COURSE_LECTURE", "COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER"];
  if (!validTypes.includes(type)) {
    throw new BadRequestError("Invalid event type");
  }

  // Validate group for GROUP_MEETING
  let groupId = null;
  if (type === "GROUP_MEETING") {
    if (!group) {
      throw new BadRequestError("Group is required for group meetings");
    }
    groupId = group;
    
    // Verify group exists and belongs to the class
    const groupRecord = await prisma.group.findFirst({
      where: {
        id: groupId,
        classId: existingEvent.classId,
      },
    });
    if (!groupRecord) {
      throw new BadRequestError("Invalid group");
    }
  }

  // Convert date/time to PST Date objects
  const startDateTime = convertToPST(date, startTime);
  const endDateTime = convertToPST(date, endTime);

  // Validate end time is after start time
  if (endDateTime <= startDateTime) {
    throw new BadRequestError("End time must be after start time");
  }

  // Update event
  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      title: escapeHtml(title),
      description: description ? escapeHtml(description) : null,
      location: location ? escapeHtml(location) : null,
      type,
      startTime: startDateTime,
      endTime: endDateTime,
      groupId,
    },
  });

  // Fetch class info for rendering
  const klass = await classService.getClassById(existingEvent.classId);
  
  // Get user's class role and groups data for rendering
  const userClassRole = await classRoleService.getClassRole(userId, existingEvent.classId);
  const isGroupLeader = groupId ? await prisma.groupRole.findFirst({
    where: {
      userId,
      groupId,
      role: "LEADER",
    },
  }) : false;

  const groupsForClass = await prisma.group.findMany({
    where: { classId: existingEvent.classId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const groupsData = {
    allGroups: groupsForClass,
    isGroupLeader,
    leaderGroupId: isGroupLeader ? groupId : null,
  };

  // Determine allowed event types
  const allowedEventTypes = [];
  if (userClassRole) {
    const classRoleType = userClassRole.role;
    if (classRoleType === "PROFESSOR" || classRoleType === "TA") {
      allowedEventTypes.push("COURSE_LECTURE", "COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (classRoleType === "TUTOR") {
      allowedEventTypes.push("COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (isGroupLeader) {
      allowedEventTypes.push("GROUP_MEETING", "OTHER");
    } else {
      allowedEventTypes.push("OTHER");
    }
  } else if (isGroupLeader) {
    allowedEventTypes.push("GROUP_MEETING", "OTHER");
  }

  // Fetch updated events for the current week
  const currentDate = new Date(startDateTime);
  const weekStart = new Date(currentDate);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const events = await eventService.getEventsByClassIdAndDateRange(
    existingEvent.classId,
    weekStart,
    weekEnd,
    userId,
    userClassRole,
  );

  // Return updated schedule
  const scheduleWrapper = renderScheduleWrapper(
    klass,
    "week",
    currentDate,
    events,
    allowedEventTypes,
    groupsData,
  );

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    res.send(`
      ${scheduleWrapper}
      <script>
        if (window.closeModal) {
          window.closeModal('modal-event-detail');
        }
        if (window.showToast) {
          window.showToast('Success', 'Event updated successfully', 'success');
        }
      </script>
    `);
  } else {
    res.json({
      status: "success",
      event: updatedEvent,
    });
  }
});

/**
 * Delete event
 * Route: DELETE /events/:id
 * Auth: requireAuth
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Fetch existing event
  const existingEvent = await eventService.getEventById(id);
  if (!existingEvent) {
    throw new NotFoundError("Event not found");
  }

  // Check permissions - use canUserModifyEvent for edit/delete operations
  const canEdit = await eventService.canUserModifyEvent(userId, id);
  if (!canEdit) {
    throw new BadRequestError("You do not have permission to delete this event");
  }

  // Delete event
  await prisma.event.delete({
    where: { id },
  });

  // Fetch class info for rendering
  const klass = await classService.getClassById(existingEvent.classId);
  
  // Get user's class role and groups data for rendering
  const userClassRole = await classRoleService.getClassRole(userId, existingEvent.classId);
  const isGroupLeader = existingEvent.groupId ? await prisma.groupRole.findFirst({
    where: {
      userId,
      groupId: existingEvent.groupId,
      role: "LEADER",
    },
  }) : false;

  const groupsForClass = await prisma.group.findMany({
    where: { classId: existingEvent.classId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const groupsData = {
    allGroups: groupsForClass,
    isGroupLeader,
    leaderGroupId: isGroupLeader ? existingEvent.groupId : null,
  };

  // Determine allowed event types
  const allowedEventTypes = [];
  if (userClassRole) {
    const classRoleType = userClassRole.role;
    if (classRoleType === "PROFESSOR" || classRoleType === "TA") {
      allowedEventTypes.push("COURSE_LECTURE", "COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (classRoleType === "TUTOR") {
      allowedEventTypes.push("COURSE_OFFICE_HOUR", "COURSE_DISCUSSION", "GROUP_MEETING", "OTHER");
    } else if (isGroupLeader) {
      allowedEventTypes.push("GROUP_MEETING", "OTHER");
    } else {
      allowedEventTypes.push("OTHER");
    }
  } else if (isGroupLeader) {
    allowedEventTypes.push("GROUP_MEETING", "OTHER");
  }

  // Fetch updated events for the current week
  const currentDate = new Date();
  const weekStart = new Date(currentDate);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const events = await eventService.getEventsByClassIdAndDateRange(
    existingEvent.classId,
    weekStart,
    weekEnd,
    userId,
    userClassRole,
  );

  // Return updated schedule
  const scheduleWrapper = renderScheduleWrapper(
    klass,
    "week",
    currentDate,
    events,
    allowedEventTypes,
    groupsData,
  );

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    res.send(`
      ${scheduleWrapper}
      <script>
        if (window.closeModal) {
          window.closeModal('modal-event-detail');
        }
        if (window.showToast) {
          window.showToast('Success', 'Event deleted successfully', 'success');
        }
      </script>
    `);
  } else {
    res.json({
      status: "success",
      message: "Event deleted successfully",
    });
  }
});

