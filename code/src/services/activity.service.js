// Service functions for Activity/Punchcard-related database operations
// code/src/services/activity.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new activity.
 */
export async function createActivity(data) {
  return prisma.activity.create({ data });
}

/**
 * Get a activity by ID, including the category and user it belongs to
 */
export async function getActivityById(id) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
        user: true,
        category: true
    }
  });
}

/**
 * Get all activities associated with userId
 */

export async function getActivitiesByUserId(userId) {
  return prisma.activity.findMany({
    where: { userId },
    include: {
      category: true
    },
    orderBy: { startTime: "desc" },   // might reverse later
  });
}

/**
 * Get all activity categories
 */

export async function getAllCategories() {
  try {
    const categories = await prisma.activityCategory.findMany({
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
 */
export async function updateActivity(id, data) {
    return prisma.activity.update({
        where: {id},
        data
    });
}

/**
 * Delete Activity
 */

export async function deleteActivity(id) {
  return prisma.activity.delete({
    where: { id }
  });
}


