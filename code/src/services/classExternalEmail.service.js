// Service functions for Class External Email-related database operations
// code/src/services/classExternalEmail.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Add an external email to a class
 * @param {string} classId - Class ID
 * @param {string} email - Email address to add
 * @returns {Promise<Object>} Created external email record
 */
export async function addExternalEmailToClass(classId, email) {
  // Normalize email (lowercase, trim)
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists for this class
  const existing = await prisma.classExternalEmail.findUnique({
    where: {
      email_classId: {
        email: normalizedEmail,
        classId,
      },
    },
  });

  if (existing) {
    return existing; // Return existing record if already added
  }

  // Create new external email record
  return prisma.classExternalEmail.create({
    data: {
      email: normalizedEmail,
      classId,
    },
  });
}

/**
 * Remove an external email from a class
 * @param {string} classId - Class ID
 * @param {string} email - Email address to remove
 * @returns {Promise<Object>} Deleted external email record
 */
export async function removeExternalEmailFromClass(classId, email) {
  const normalizedEmail = email.trim().toLowerCase();

  return prisma.classExternalEmail.delete({
    where: {
      email_classId: {
        email: normalizedEmail,
        classId,
      },
    },
  });
}

/**
 * Get all external emails for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of external email records
 */
export async function getExternalEmailsByClassId(classId) {
  return prisma.classExternalEmail.findMany({
    where: {
      classId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Check if an email is allowed for any class (used in auth)
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if email is in any class's external emails
 */
export async function isEmailAllowedForAnyClass(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const count = await prisma.classExternalEmail.count({
    where: {
      email: normalizedEmail,
    },
  });

  return count > 0;
}
