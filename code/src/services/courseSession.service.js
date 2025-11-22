// Service functions for CourseSession-related database operations
// code/src/services/courseSession.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new course session
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
 */
export async function deleteCourseSession(id) {
  return prisma.courseSession.delete({
    where: {
      id,
    },
  });
}
