// Service functions for AttendancePoll-related database operations
// code/src/services/attendancePoll.service.js

import { prisma } from "../lib/prisma.js";
import { generateUniqueCode } from "../utils/code-generator.js";
import { env } from "../config/env.js";

/**
 * Check if a code is unique (not already in use by an active poll)
 */
async function isCodeUnique(code) {
  const existing = await prisma.attendancePoll.findUnique({
    where: {
      code,
    },
  });
  return !existing;
}

/**
 * Create a new attendance poll for a session
 * @param {string} sessionId - ID of the course session
 * @param {number} durationMinutes - Duration in minutes (optional, uses default if not provided)
 * @param {string} createdBy - User ID of professor creating the poll
 * @returns {Promise<Object>} Created poll with code and expiration
 */
export async function createAttendancePoll(
  sessionId,
  durationMinutes,
  createdBy,
) {
  // Use provided duration or default from config
  const duration = durationMinutes || env.ATTENDANCE_DEFAULT_DURATION;

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + duration);

  // Generate unique code
  const code = await generateUniqueCode(isCodeUnique);

  // Create poll in database
  return prisma.attendancePoll.create({
    data: {
      sessionId,
      createdBy,
      code,
      expiresAt,
      durationMinutes: duration,
      active: true,
    },
    include: {
      session: {
        include: {
          class: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Find an active poll by code
 * @param {string} code - 8-digit attendance code
 * @returns {Promise<Object|null>} Poll if found and active, null otherwise
 */
export async function findActivePollByCode(code) {
  const now = new Date();

  return prisma.attendancePoll.findFirst({
    where: {
      code,
      active: true,
      expiresAt: {
        gt: now, // Not expired
      },
    },
    include: {
      session: {
        include: {
          class: true,
        },
      },
    },
  });
}

/**
 * Get all polls for a session
 */
export async function getPollsBySessionId(sessionId) {
  return prisma.attendancePoll.findMany({
    where: {
      sessionId,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          records: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Deactivate a poll (close it early)
 */
export async function deactivatePoll(pollId) {
  return prisma.attendancePoll.update({
    where: {
      id: pollId,
    },
    data: {
      active: false,
    },
  });
}

/**
 * Check if a poll is expired (server-side validation)
 */
export function isPollExpired(poll) {
  if (!poll) {
    return true;
  }
  const now = new Date();
  return now >= new Date(poll.expiresAt);
}

