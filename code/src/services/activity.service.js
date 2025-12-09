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
 * Create a new activity category
 *
 * @param {Object} data - The category data to create
 * @returns {Promise<Object>} The created category
 */
export async function createActivityCategory(data) {
  return prisma.activityCategory.create({ data });
}

/**
 * Get a activity category
 * 
 * @param {string} id - The ID of the category to fetch.
 * @returns {Promise<Object|null>} The category object or null if not found.
 */
export async function getActivityCategory(id) {
  return prisma.activityCategory.findUnique({
    where: { id },
  });
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
 * Map class role to category role
 * @param {string} classRole - The class role (PROFESSOR, TA, STUDENT, TUTOR)
 * @returns {string} The corresponding CategoryRole (STUDENT, TA, or ALL)
 */
function mapClassRoleToCategoryRole(classRole) {
  const role = classRole?.toUpperCase();

  // CategoryRole enum: STUDENT, TA, ALL
  // ClassRole enum: PROFESSOR, TA, STUDENT, TUTOR
  switch (role) {
    case "STUDENT":
      return "STUDENT";
    case "TA":
    case "TUTOR":
      return "TA";
    case "PROFESSOR":
      // Professors can see all categories
      return "ALL";
    default:
      // Default to ALL for unknown roles
      return "ALL";
  }
}

/**
 * Get all activity categories
 *
 * @param {string} userRole - The role of the user (e.g., "PROFESSOR", "TA", "STUDENT", "TUTOR").
 * @returns {Promise<Object[]>} A list of activity categories.
 */
export async function getAllCategories(userRole) {
  try {
    const categoryRole = mapClassRoleToCategoryRole(userRole);

    const categories = await prisma.activityCategory.findMany({
      where: {
        OR: [{ role: categoryRole }, { role: "ALL" }],
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

/**
 * Get or find the "Lecture" activity category
 * @returns {Promise<Object|null>} The Lecture category or null if not found
 */
export async function getLectureCategory() {
  return prisma.activityCategory.findUnique({
    where: { name: "Lecture" },
  });
}
