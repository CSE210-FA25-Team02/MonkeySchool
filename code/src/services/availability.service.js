import { prisma } from "../lib/prisma.js";

/**
 * Time utilities for 30-minute intervals from 8:00 AM to 8:00 PM
 */
export const TIME_SLOTS = [];
for (let hour = 8; hour <= 20; hour++) {
  TIME_SLOTS.push(`${hour.toString().padStart(2, "0")}:00`);
  if (hour < 20) {
    // Don't add :30 for 8 PM (20:00)
    TIME_SLOTS.push(`${hour.toString().padStart(2, "0")}:30`);
  }
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Validate time format and range
 * @param {string} time - Time in HH:MM format
 * @returns {boolean}
 */
export function isValidTime(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours < 8 || hours > 20) return false;
  if (minutes !== 0 && minutes !== 30) return false;

  return TIME_SLOTS.includes(time);
}

/**
 * Validate day of week
 * @param {number} dayOfWeek - 0-6 (Sunday-Saturday)
 * @returns {boolean}
 */
export function isValidDayOfWeek(dayOfWeek) {
  return Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6;
}

/**
 * Add user availability for a time range
 * @param {string} userId
 * @param {number} dayOfWeek
 * @param {string} startTime
 * @param {string} endTime
 * @returns {Promise<Object>}
 */
export async function addUserAvailability(
  userId,
  dayOfWeek,
  startTime,
  endTime
) {
  if (!isValidDayOfWeek(dayOfWeek)) {
    throw new Error(`Invalid dayOfWeek: ${dayOfWeek}. Must be 0-6.`);
  }
  if (!isValidTime(startTime)) {
    throw new Error(`Invalid startTime: ${startTime}`);
  }
  if (!isValidTime(endTime)) {
    throw new Error(`Invalid endTime: ${endTime}`);
  }
  if (startTime >= endTime) {
    throw new Error("startTime must be before endTime");
  }

  return await prisma.availability.create({
    data: {
      userId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable: true,
    },
  });
}

/**
 * Delete user availability
 * @param {string} availabilityId
 * @param {string} userId - For permission check
 * @returns {Promise<Object>}
 */
export async function deleteUserAvailability(availabilityId, userId) {
  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId },
  });

  if (!availability) {
    throw new Error("Availability record not found");
  }

  if (availability.userId !== userId) {
    throw new Error("Permission denied");
  }

  return await prisma.availability.delete({
    where: { id: availabilityId },
  });
}

/**
 * Get all availability for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getUserAvailability(userId) {
  return await prisma.availability.findMany({
    where: { userId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

/**
 * Set complete weekly availability for a user (replaces existing)
 * @param {string} userId
 * @param {Array} availabilityRanges - Array of {dayOfWeek, startTime, endTime}
 * @returns {Promise<Array>}
 */
export async function setUserWeeklyAvailability(userId, availabilityRanges) {
  // Validate all ranges first
  for (const range of availabilityRanges) {
    if (!isValidDayOfWeek(range.dayOfWeek)) {
      throw new Error(`Invalid dayOfWeek: ${range.dayOfWeek}`);
    }
    if (!isValidTime(range.startTime)) {
      throw new Error(`Invalid startTime: ${range.startTime}`);
    }
    if (!isValidTime(range.endTime)) {
      throw new Error(`Invalid endTime: ${range.endTime}`);
    }
    if (range.startTime >= range.endTime) {
      throw new Error("startTime must be before endTime");
    }
  }

  // Use transaction to replace all availability atomically
  return await prisma.$transaction(async (tx) => {
    // Delete existing availability
    await tx.availability.deleteMany({
      where: { userId },
    });

    // Create new availability records
    const newRecords = await Promise.all(
      availabilityRanges.map((range) =>
        tx.availability.create({
          data: {
            userId,
            dayOfWeek: range.dayOfWeek,
            startTime: range.startTime,
            endTime: range.endTime,
            isAvailable: true,
          },
        })
      )
    );

    return newRecords;
  });
}

/**
 * Convert time slots grid to availability ranges
 * @param {Object} slotsGrid - Object with day keys and time slot arrays
 * @returns {Array} Array of {dayOfWeek, startTime, endTime}
 */
export function convertSlotsToRanges(slotsGrid) {
  const ranges = [];

  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    const daySlots = slotsGrid[dayOfWeek] || [];
    if (daySlots.length === 0) continue;

    // Sort time slots
    const sortedSlots = [...daySlots].sort((a, b) => {
      const aIndex = TIME_SLOTS.indexOf(a);
      const bIndex = TIME_SLOTS.indexOf(b);
      return aIndex - bIndex;
    });

    // Group consecutive slots into ranges
    let rangeStart = null;
    let lastSlot = null;

    for (const slot of sortedSlots) {
      const slotIndex = TIME_SLOTS.indexOf(slot);
      const lastIndex = lastSlot ? TIME_SLOTS.indexOf(lastSlot) : -1;

      if (rangeStart === null) {
        // Start new range
        rangeStart = slot;
      } else if (slotIndex !== lastIndex + 1) {
        // Gap found, end current range and start new one
        const endTime = TIME_SLOTS[lastIndex + 1] || "20:00";
        ranges.push({
          dayOfWeek,
          startTime: rangeStart,
          endTime: endTime,
        });
        rangeStart = slot;
      }

      lastSlot = slot;
    }

    // Close final range
    if (rangeStart !== null && lastSlot !== null) {
      const lastIndex = TIME_SLOTS.indexOf(lastSlot);
      const endTime = TIME_SLOTS[lastIndex + 1] || "20:00";
      ranges.push({
        dayOfWeek,
        startTime: rangeStart,
        endTime: endTime,
      });
    }
  }

  return ranges;
}

/**
 * Get user's groups with class information
 * @param {string} userId
 * @returns {Promise<Array>} Array of groups with class info
 */
export async function getUserGroups(userId) {
  return await prisma.groupRole.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          class: true,
        },
      },
    },
  });
}

/**
 * Get all members of a group with their availability
 * @param {string} groupId
 * @returns {Promise<Object>} Group info with members and their availability
 */
export async function getGroupAvailability(groupId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      class: true,
      members: {
        include: {
          user: {
            include: {
              availability: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    throw new Error("Group not found");
  }

  return {
    id: group.id,
    name: group.name,
    class: {
      id: group.class.id,
      name: group.class.name,
    },
    members: group.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      role: member.role,
      availability: member.user.availability,
    })),
  };
}

/**
 * Get availability for multiple groups
 * @param {string} userId
 * @returns {Promise<Array>} Array of group availability data
 */
export async function getUserGroupsAvailability(userId) {
  const userGroups = await getUserGroups(userId);

  const groupsAvailability = await Promise.all(
    userGroups.map(async (userGroup) => {
      const groupAvailability = await getGroupAvailability(userGroup.group.id);
      return groupAvailability;
    })
  );

  return groupsAvailability;
}
