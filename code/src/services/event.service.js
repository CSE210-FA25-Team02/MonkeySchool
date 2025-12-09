// Service functions for Event-related database operations
// code/src/services/event.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Helper function to check if user has permission to create specific event type
 * @param {string} userId - User ID
 * @param {string} eventType - Event type (COURSE_LECTURE, COURSE_OFFICE_HOUR, etc.)
 * @param {string} classId - Class ID for context
 * @param {string} groupId - Group ID for context (optional)
 * @returns {Promise<boolean>} True if user has permission
 */
export async function canUserCreateEventType(
  userId,
  eventType,
  classId,
  groupId = null,
) {
  // Get user's role in the class
  const classRole = await prisma.classRole.findFirst({
    where: {
      userId,
      classId,
    },
  });

  if (!classRole) return false;

  // Check permission for GROUP_MEETING events
  // Allowed: Professor, TA, Tutor, or Group Leader
  if (eventType === "GROUP_MEETING") {
    // Check if user is Professor, TA, or Tutor
    if (["PROFESSOR", "TA", "TUTOR"].includes(classRole.role)) {
      return true;
    }

    // Check if user is a group leader
    if (groupId) {
      // If checking for a specific group, check if user is leader of that group
      const groupRole = await prisma.groupRole.findFirst({
        where: {
          userId,
          groupId,
          role: "LEADER",
        },
      });
      return !!groupRole;
    } else {
      // If no specific group provided, check if user is a leader of any group in the class
      const groupLeaderRoles = await prisma.groupRole.findMany({
        where: {
          userId,
          role: "LEADER",
          group: {
            classId,
          },
        },
      });
      return groupLeaderRoles.length > 0;
    }
  }

  // Check course-related event permissions
  if (["COURSE_LECTURE", "COURSE_OFFICE_HOUR"].includes(eventType)) {
    // Only Professor and TA can create lectures and office hours
    return ["PROFESSOR", "TA"].includes(classRole.role);
  }

  if (eventType === "COURSE_DISCUSSION") {
    // Professor, TA, and Tutor can create discussions
    return ["PROFESSOR", "TA", "TUTOR"].includes(classRole.role);
  }

  // OTHER events can be created by anyone in the class
  if (eventType === "OTHER") {
    return true;
  }

  return false;
}

/**
 * Helper function to check if user can edit/delete specific event
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} True if user has permission
 */
export async function canUserModifyEvent(userId, eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      class: true,
      group: true,
    },
  });

  if (!event) return false;

  // Creator can always modify their event
  if (event.userId === userId) return true;

  // Get user's class role
  if (event.classId) {
    const classRole = await prisma.classRole.findFirst({
      where: {
        userId,
        classId: event.classId,
      },
    });

    // Professors and TAs can modify course-related events
    if (classRole && ["PROFESSOR", "TA"].includes(classRole.role)) {
      if (
        ["COURSE_LECTURE", "COURSE_OFFICE_HOUR", "COURSE_DISCUSSION"].includes(
          event.type,
        )
      ) {
        return true;
      }
    }
  }

  // Group leaders can modify group meetings in their groups
  if (event.groupId && event.type === "GROUP_MEETING") {
    const groupRole = await prisma.groupRole.findFirst({
      where: {
        userId,
        groupId: event.groupId,
        role: "LEADER",
      },
    });
    return !!groupRole;
  }

  return false;
}

/**
 * Create a new event
 * @param {Object} eventData - Event creation data
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description (optional)
 * @param {string} eventData.type - Event type
 * @param {Date} eventData.startTime - Event start time
 * @param {Date} eventData.endTime - Event end time
 * @param {string} eventData.location - Event location (optional)
 * @param {boolean} eventData.isRecurring - Whether event is recurring
 * @param {string} eventData.recurrencePattern - Recurrence pattern (optional)
 * @param {string} eventData.classId - Class ID (optional)
 * @param {string} eventData.groupId - Group ID (optional)
 * @param {string} eventData.userId - Creator user ID
 * @returns {Promise<Object>} Created event record
 */
export async function createEvent(eventData) {
  // Validate permissions before creating
  const hasPermission = await canUserCreateEventType(
    eventData.userId,
    eventData.type,
    eventData.classId,
    eventData.groupId,
  );

  if (!hasPermission) {
    throw new Error(
      `User does not have permission to create ${eventData.type} events`,
    );
  }

  return prisma.event.create({
    data: eventData,
    include: {
      class: true,
      group: true,
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get event by ID
 * @param {string} id - Event ID
 * @returns {Promise<Object|null>} Event record or null if not found
 */
export async function getEventById(id) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      class: true,
      group: true,
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Update an event
 * @param {string} id - Event ID
 * @param {Object} data - Fields to update
 * @param {string} userId - ID of user making the update (for permission check)
 * @returns {Promise<Object>} Updated event record
 */
export async function updateEvent(id, data, userId) {
  // Check if user has permission to modify this event
  const hasPermission = await canUserModifyEvent(userId, id);

  if (!hasPermission) {
    throw new Error("User does not have permission to modify this event");
  }

  return prisma.event.update({
    where: { id },
    data,
    include: {
      class: true,
      group: true,
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Delete an event
 * @param {string} id - Event ID
 * @param {string} userId - ID of user making the deletion (for permission check)
 * @returns {Promise<Object>} Deleted event record
 */
export async function deleteEvent(id, userId) {
  // Check if user has permission to modify this event
  const hasPermission = await canUserModifyEvent(userId, id);

  if (!hasPermission) {
    throw new Error("User does not have permission to delete this event");
  }

  return prisma.event.delete({
    where: { id },
    include: {
      class: true,
      group: true,
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get all events for a specific class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of events for the class
 */
export async function getEventsByClassId(classId) {
  return prisma.event.findMany({
    where: { classId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
      group: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Get events for a specific class within a date range
 * @param {string} classId - Class ID
 * @param {Date} weekStart - Start of the date range (inclusive)
 * @param {Date} weekEnd - End of the date range (exclusive)
 * @param {string} [userId] - Optional user ID for filtering (students only see their group's meetings)
 * @param {string} [userClassRole] - Optional user's class role (STUDENT, PROFESSOR, TA, TUTOR)
 * @returns {Promise<Array>} Array of events for the class within the date range
 */
export async function getEventsByClassIdAndDateRange(
  classId,
  weekStart,
  weekEnd,
  userId = null,
  userClassRole = null,
) {
  // Build where clause
  const whereClause = {
    classId,
    startTime: {
      gte: weekStart,
      lt: weekEnd,
    },
  };

  // If user is a STUDENT, filter GROUP_MEETING events to only show their group's meetings
  if (userClassRole === "STUDENT" && userId) {
    // Find the student's group in this class
    const studentGroupRole = await prisma.groupRole.findFirst({
      where: {
        userId,
        group: {
          classId,
        },
      },
      select: {
        groupId: true,
      },
    });

    if (studentGroupRole) {
      // Student is in a group - only show their group's meetings and all non-group events
      whereClause.OR = [
        // Show all non-group events (no groupId)
        { groupId: null },
        // Show GROUP_MEETING events for their group
        {
          type: "GROUP_MEETING",
          groupId: studentGroupRole.groupId,
        },
        // Show all non-GROUP_MEETING events (even if they have a groupId, which shouldn't happen)
        { type: { not: "GROUP_MEETING" } },
      ];
    } else {
      // Student is not in any group - only show non-group events
      whereClause.groupId = null;
    }
  }
  // For PROFESSOR, TA, TUTOR, or no role - show all events (no filtering)

  return prisma.event.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
      group: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Get all events for a specific group
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} Array of events for the group
 */
export async function getEventsByGroupId(groupId) {
  return prisma.event.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
        },
      },
      class: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Get class events with user permissions included
 * @param {string} classId - Class ID
 * @param {string} userId - User ID to check permissions for
 * @returns {Promise<Array>} Array of events with permission flags
 */
export async function getClassEventsWithPermissions(classId, userId) {
  const events = await getEventsByClassId(classId);

  // Add permission flags for each event
  const eventsWithPermissions = await Promise.all(
    events.map(async (event) => {
      const canEdit = await canUserModifyEvent(userId, event.id);
      const canDelete = await canUserModifyEvent(userId, event.id);

      return {
        ...event,
        permissions: {
          canEdit,
          canDelete,
          isCreator: event.userId === userId,
        },
      };
    }),
  );

  return eventsWithPermissions;
}

/**
 * Get user's event creation permissions for a class
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} Object with permission flags for each event type
 */
export async function getUserEventPermissions(userId, classId) {
  const permissions = {};
  const eventTypes = [
    "COURSE_LECTURE",
    "COURSE_OFFICE_HOUR",
    "COURSE_DISCUSSION",
    "GROUP_MEETING",
    "OTHER",
  ];

  for (const eventType of eventTypes) {
    permissions[eventType] = await canUserCreateEventType(
      userId,
      eventType,
      classId,
    );
  }

  return permissions;
}

/**
 * Get upcoming events for a user across all their classes
 * Returns top 3 upcoming events sorted by startTime
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of formatted event objects for dashboard display
 */
export async function getUpcomingEvents(userId) {
  const now = new Date();

  // Get all classes the user is enrolled in
  const classRoles = await prisma.classRole.findMany({
    where: {
      userId,
    },
    select: {
      classId: true,
      role: true,
    },
  });

  if (classRoles.length === 0) {
    return [];
  }

  const classIds = classRoles.map((cr) => cr.classId);
  const classRoleMap = new Map(classRoles.map((cr) => [cr.classId, cr.role]));

  // Get all upcoming events from user's classes
  const allEvents = await prisma.event.findMany({
    where: {
      classId: {
        in: classIds,
      },
      startTime: {
        gte: now,
      },
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      group: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Pre-fetch user's group memberships for efficient filtering
  const userGroupRoles = await prisma.groupRole.findMany({
    where: {
      userId,
      group: {
        classId: {
          in: classIds,
        },
      },
    },
    select: {
      groupId: true,
    },
  });

  const userGroupIds = new Set(userGroupRoles.map((gr) => gr.groupId));

  // Filter events based on user role (students only see their group's meetings)
  const filteredEvents = [];
  for (const event of allEvents) {
    const userRole = classRoleMap.get(event.classId);

    // If user is a STUDENT, filter GROUP_MEETING events to only show their group's meetings
    if (userRole === "STUDENT" && event.type === "GROUP_MEETING") {
      // Only include if student is in the group for this event
      if (event.groupId && userGroupIds.has(event.groupId)) {
        filteredEvents.push(event);
      }
      // Otherwise, skip this GROUP_MEETING event for students
    } else {
      // For all other cases (PROFESSOR, TA, TUTOR, or non-GROUP_MEETING events), include the event
      filteredEvents.push(event);
    }
  }

  // Take top 3 events
  const topEvents = filteredEvents.slice(0, 3);

  // Format events for dashboard display
  return topEvents.map((event) => {
    const startTime = new Date(event.startTime);

    // Format date
    const dateStr = startTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Format time
    const timeStr = startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Map event type enum to lowercase format for dashboard template
    const typeMap = {
      COURSE_LECTURE: "lecture",
      COURSE_OFFICE_HOUR: "office-hours",
      COURSE_DISCUSSION: "lecture", // Use lecture style
      GROUP_MEETING: "meeting",
      OTHER: "meeting", // Default to meeting style
    };

    return {
      id: event.id,
      title: event.title,
      date: dateStr,
      time: timeStr,
      type: typeMap[event.type] || "meeting",
      classId: event.classId,
      className: event.class?.name || "Unknown Class",
    };
  });
}
