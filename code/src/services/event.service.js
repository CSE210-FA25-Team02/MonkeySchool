// Service functions for Event-related database operations
// code/src/services/event.service.js

import { prisma } from '../lib/prisma.js';

/**
 * Helper function to check if user has permission to create specific event type
 * @param {string} userId - User ID
 * @param {string} eventType - Event type (COURSE_LECTURE, COURSE_OFFICE_HOUR, etc.)
 * @param {string} classId - Class ID for context
 * @param {string} groupId - Group ID for context (optional)
 * @returns {Promise<boolean>} True if user has permission
 */
async function canUserCreateEventType(
  userId,
  eventType,
  classId,
  groupId = null
) {
  // Get user's role in the class
  const classRole = await prisma.classRole.findFirst({
    where: {
      userId,
      classId,
    },
  });

  if (!classRole) return false;

  // Check group leader permission if it's a GROUP_MEETING
  if (eventType === 'GROUP_MEETING') {
    if (groupId) {
      // If checking for a specific group, check if user is leader of that group
      const groupRole = await prisma.groupRole.findFirst({
        where: {
          userId,
          groupId,
          role: 'LEADER',
        },
      });
      return !!groupRole;
    } else {
      // If no specific group provided, check if user is a leader of any group in the class
      const groupLeaderRoles = await prisma.groupRole.findMany({
        where: {
          userId,
          role: 'LEADER',
          group: {
            classId,
          },
        },
      });
      return groupLeaderRoles.length > 0;
    }
  }

  // Check course-related event permissions
  if (
    ['COURSE_LECTURE', 'COURSE_OFFICE_HOUR', 'COURSE_DISCUSSION'].includes(
      eventType
    )
  ) {
    return ['PROFESSOR', 'TA'].includes(classRole.role);
  }

  // OTHER events can be created by anyone in the class
  if (eventType === 'OTHER') {
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
async function canUserModifyEvent(userId, eventId) {
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
    if (classRole && ['PROFESSOR', 'TA'].includes(classRole.role)) {
      if (
        ['COURSE_LECTURE', 'COURSE_OFFICE_HOUR', 'COURSE_DISCUSSION'].includes(
          event.type
        )
      ) {
        return true;
      }
    }
  }

  // Group leaders can modify group meetings in their groups
  if (event.groupId && event.type === 'GROUP_MEETING') {
    const groupRole = await prisma.groupRole.findFirst({
      where: {
        userId,
        groupId: event.groupId,
        role: 'LEADER',
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
    eventData.groupId
  );

  if (!hasPermission) {
    throw new Error(
      `User does not have permission to create ${eventData.type} events`
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
    throw new Error('User does not have permission to modify this event');
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
    throw new Error('User does not have permission to delete this event');
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
      startTime: 'asc',
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
      startTime: 'asc',
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
    })
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
    'COURSE_LECTURE',
    'COURSE_OFFICE_HOUR',
    'COURSE_DISCUSSION',
    'GROUP_MEETING',
    'OTHER',
  ];

  for (const eventType of eventTypes) {
    permissions[eventType] = await canUserCreateEventType(
      userId,
      eventType,
      classId
    );
  }

  return permissions;
}
