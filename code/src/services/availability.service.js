import { prisma } from "../lib/prisma.js";

/**
 * Time utilities for 30-minute intervals from 8:00 AM to 12:00 AM (midnight)
 */
export const TIME_SLOTS = [];
for (let hour = 8; hour < 24; hour++) {
  TIME_SLOTS.push(`${hour.toString().padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${hour.toString().padStart(2, "0")}:30`);
}
TIME_SLOTS.push("00:00");

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday", 
  "Tuesday",
  "Wednesday",
  "Thursday", 
  "Friday",
  "Saturday"
];

/**
 * Validate time format and range
 * @param {string} time - Time in HH:MM format
 * @returns {boolean}
 */
export function isValidTime(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours < 0 || hours > 23) return false;
  if (minutes !== 0 && minutes !== 30) return false;
  
  if (hours < 8 && time !== "00:00") return false;
  
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
export async function addUserAvailability(userId, dayOfWeek, startTime, endTime) {
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
      isAvailable: true
    }
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
    where: { id: availabilityId }
  });

  if (!availability) {
    throw new Error("Availability record not found");
  }

  if (availability.userId !== userId) {
    throw new Error("Permission denied");
  }

  return await prisma.availability.delete({
    where: { id: availabilityId }
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
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" }
    ]
  });
}

/**
 * Get group availability with density ranking
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export async function getGroupAvailability(groupId) {
  console.log(`[getGroupAvailability] Getting availability for groupId: ${groupId}`);
  
  // Get all group members with their availability
  const groupMembers = await prisma.groupRole.findMany({
    where: { groupId },
    include: {
      user: {
        include: {
          availability: {
            where: { isAvailable: true }
          }
        }
      }
    }
  });

  console.log(`[getGroupAvailability] Found ${groupMembers.length} group members`);
  groupMembers.forEach((member, index) => {
    console.log(`[getGroupAvailability] Member ${index + 1}: ${member.user.name || member.user.email} (${member.user.id})`);
    console.log(`[getGroupAvailability] - Role: ${member.role}`);
    console.log(`[getGroupAvailability] - Availability records: ${member.user.availability.length}`);
    member.user.availability.forEach((avail, availIndex) => {
      console.log(`[getGroupAvailability]   ${availIndex + 1}. Day ${avail.dayOfWeek}, ${avail.startTime}-${avail.endTime}, Available: ${avail.isAvailable}`);
    });
  });

  const totalMembers = groupMembers.length;
  
  // Create density map for each day and time slot
  const densityMap = {};
  for (let day = 0; day <= 6; day++) {
    densityMap[day] = {};
    TIME_SLOTS.forEach(timeSlot => {
      densityMap[day][timeSlot] = {
        availableCount: 0,
        density: 0, // 0-1 ratio
        availableMembers: []
      };
    });
  }

  // Count availability for each time slot
  console.log(`[getGroupAvailability] Processing availability for ${groupMembers.length} members...`);
  groupMembers.forEach(member => {
    console.log(`[getGroupAvailability] Processing member: ${member.user.name || member.user.email}`);
    member.user.availability.forEach(avail => {
      console.log(`[getGroupAvailability] Processing availability: Day ${avail.dayOfWeek}, ${avail.startTime}-${avail.endTime}`);
      // For each availability range, count all 30-min slots
      const startIndex = TIME_SLOTS.indexOf(avail.startTime);
      const endIndex = TIME_SLOTS.indexOf(avail.endTime);
      
      console.log(`[getGroupAvailability] Time slot indices: start=${startIndex}, end=${endIndex}`);
      
      if (startIndex !== -1 && endIndex !== -1) {
        for (let i = startIndex; i < endIndex; i++) {
          const timeSlot = TIME_SLOTS[i];
          densityMap[avail.dayOfWeek][timeSlot].availableCount++;
          densityMap[avail.dayOfWeek][timeSlot].availableMembers.push({
            id: member.user.id,
            name: member.user.preferredName || member.user.name
          });
          console.log(`[getGroupAvailability] Added ${member.user.name || member.user.email} to day ${avail.dayOfWeek}, slot ${timeSlot}`);
        }
      } else {
        console.log(`[getGroupAvailability] ERROR: Invalid time slots for ${avail.startTime}-${avail.endTime}`);
      }
    });
  });

  // Calculate density ratios
  for (let day = 0; day <= 6; day++) {
    TIME_SLOTS.forEach(timeSlot => {
      const slot = densityMap[day][timeSlot];
      slot.density = totalMembers > 0 ? slot.availableCount / totalMembers : 0;
    });
  }

  return {
    groupId,
    totalMembers,
    densityMap,
    timeSlots: TIME_SLOTS,
    daysOfWeek: DAYS_OF_WEEK
  };
}
