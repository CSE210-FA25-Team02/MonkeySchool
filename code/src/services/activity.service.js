// Service functions for Activity/Punchcard-related database operations
// code/src/services/activity.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new activity.
 *
 * @param {Object} data - The activity data to create.
 * @returns {Promise<Object>} The created activity punch.
 */
export async function createActivity(data) {
  return prisma.activity.create({ data });
}

/**
 * Get a activity by ID, including the category and user it belongs to
 *
 * @param {string} id - The ID of the activity to fetch.
 * @returns {Promise<Object|null>} The activity object or null if not found.
 */
export async function getActivityById(id) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      user: true,
      category: true,
      class: true,
    },
  });
}

/**
 * Get all activities associated with userId
 *
 * @param {string} userId - The ID of the user whose activities should be fetched.
 * @returns {Promise<Object[]>} A list of activity records.
 */
export async function getActivitiesByUserId(userId) {
  return prisma.activity.findMany({
    where: { userId },
    include: {
      category: true,
      class: true,
    },
    orderBy: { startTime: "desc" },
  });
}

/**
 * Get all activity categories
 *
 * @param {string} userRole - The role of the user (e.g., "STUDENT", "TA").
 * @returns {Promise<Object[]>} A list of activity categories.
 */
export async function getAllCategories(userRole) {
  try {
    const categories = await prisma.activityCategory.findMany({
      where: {
        OR: [{ role: userRole }, { role: "ALL" }],
      },
      orderBy: { name: "asc" },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Update Activity (category, time, summary, etc.)
 *
 * @param {string} id - The ID of the activity to update.
 * @param {Object} data - The fields to update in the activity.
 * @returns {Promise<Object>} The updated activity record.
 */
export async function updateActivity(id, data) {
  return prisma.activity.update({
    where: { id },
    data,
  });
}

/**
 * Delete Activity
 *
 * @param {string} id - The ID of the activity to delete.
 * @returns {Promise<Object>} The deleted activity record.
 */
export async function deleteActivity(id) {
  return prisma.activity.delete({
    where: { id },
  });
}
