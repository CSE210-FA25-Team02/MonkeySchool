// Service functions for Work Journal-related database operations
// code/src/services/workJournal.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new work journal entry
 * @param {Object} data - Work journal data
 * @param {string} data.userId - User ID
 * @param {string} data.content - Journal content
 * @param {string} [data.mood] - Mood (optional)
 * @returns {Promise<Object>} Created work journal entry
 */
export async function createWorkJournal(data) {
  return prisma.workJournal.create({
    data: {
      userId: data.userId,
      content: data.content,
      mood: data.mood || null,
    },
    include: {
      user: {
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
 * Get all work journals for a user, ordered by most recent first
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of work journal entries
 */
export async function getWorkJournalsByUserId(userId) {
  return prisma.workJournal.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
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
 * Get a work journal by ID
 * @param {string} id - Work journal ID
 * @returns {Promise<Object|null>} Work journal entry or null if not found
 */
export async function getWorkJournalById(id) {
  return prisma.workJournal.findUnique({
    where: {
      id,
    },
    include: {
      user: {
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
 * Update a work journal entry
 * @param {string} id - Work journal ID
 * @param {Object} data - Update data
 * @param {string} [data.content] - Updated content
 * @param {string} [data.mood] - Updated mood
 * @returns {Promise<Object>} Updated work journal entry
 */
export async function updateWorkJournal(id, data) {
  return prisma.workJournal.update({
    where: {
      id,
    },
    data: {
      ...(data.content !== undefined && { content: data.content }),
      ...(data.mood !== undefined && { mood: data.mood }),
    },
    include: {
      user: {
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
 * Delete a work journal entry
 * @param {string} id - Work journal ID
 * @returns {Promise<Object>} Deleted work journal entry
 */
export async function deleteWorkJournal(id) {
  return prisma.workJournal.delete({
    where: {
      id,
    },
  });
}
