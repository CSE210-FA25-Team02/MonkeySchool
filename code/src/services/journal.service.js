import { prisma } from "../lib/prisma.js";

/**
 * Create a new journal entry
 * @param {string} userId - The ID of the user creating the entry
 * @param {Object} data - The entry data
 * @param {string} [data.title] - The title of the entry
 * @param {string} data.workLog - The work log content
 * @param {string} data.reflection - The reflection content
 * @returns {Promise<Object>} The created entry
 */
export const createEntry = async (userId, data) => {
  return prisma.journalEntry.create({
    data: {
      userId,
      title: data.title,
      workLog: data.workLog,
      reflection: data.reflection,
    },
  });
};

/**
 * Get all journal entries for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} List of entries ordered by creation date descending
 */
export const getEntriesByUser = async (userId) => {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get a specific journal entry by ID
 * @param {string} id - The ID of the entry
 * @returns {Promise<Object|null>} The entry or null if not found
 */
export const getEntryById = async (id) => {
  return prisma.journalEntry.findUnique({
    where: { id },
  });
};

/**
 * Update a journal entry
 * @param {string} id - The ID of the entry
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} The updated entry
 */
export const updateEntry = async (id, data) => {
  return prisma.journalEntry.update({
    where: { id },
    data: {
      title: data.title,
      workLog: data.workLog,
      reflection: data.reflection,
    },
  });
};

/**
 * Delete a journal entry
 * @param {string} id - The ID of the entry
 * @returns {Promise<Object>} The deleted entry
 */
export const deleteEntry = async (id) => {
  return prisma.journalEntry.delete({
    where: { id },
  });
};