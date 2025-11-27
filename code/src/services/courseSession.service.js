// Service functions for CourseSession-related database operations
// code/src/services/courseSession.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new course session
 * @param {Object} root0 - Session data object
 * @param {string} root0.classId - ID of the class
 * @param {string} root0.name - Name of the session
 * @param {Date} root0.date - Date of the session
 * @param {string} [root0.startTime] - Start time of the session
 * @param {string} [root0.endTime] - End time of the session
 * @returns {Promise<Object>} Created course session
 */
export async function createCourseSession({
  classId,
  name,
  date,
  startTime,
  endTime,
}) {
  return prisma.courseSession.create({
    data: {
      classId,
      name,
      date,
      startTime,
      endTime,
    },
    include: {
      class: true,
    },
  });
}

/**
 * Get a course session by ID
 * @param {string} id - ID of the course session
 * @returns {Promise<Object|null>} Course session or null if not found
 */
export async function getCourseSessionById(id) {
  return prisma.courseSession.findUnique({
    where: {
      id,
    },
    include: {
      class: true,
      attendancePolls: {
        where: {
          active: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

/**
 * Get all sessions for a class
 * @param {string} classId - ID of the class
 * @returns {Promise<Array>} Array of course sessions
 */
export async function getSessionsByClassId(classId) {
  return prisma.courseSession.findMany({
    where: {
      classId,
    },
    include: {
      attendancePolls: {
        where: {
          active: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          attendanceRecords: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

/**
 * Get sessions for a class on a specific date (for "Today's sessions")
 * @param {string} classId - ID of the class
 * @param {Date} date - Date to filter sessions
 * @returns {Promise<Array>} Array of course sessions for the date
 */
export async function getSessionsByClassIdAndDate(classId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.courseSession.findMany({
    where: {
      classId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      attendancePolls: {
        where: {
          active: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          attendanceRecords: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });
}

/**
 * Update a course session
 * @param {string} id - ID of the course session
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated course session
 */
export async function updateCourseSession(id, data) {
  return prisma.courseSession.update({
    where: {
      id,
    },
    data,
    include: {
      class: true,
    },
  });
}

/**
 * Delete a course session
 * @param {string} id - ID of the course session
 * @returns {Promise<Object>} Deleted course session
 */
export async function deleteCourseSession(id) {
  return prisma.courseSession.delete({
    where: {
      id,
    },
  });
}
