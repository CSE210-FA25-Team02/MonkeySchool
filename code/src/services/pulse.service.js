// Service functions for Pulse Entry-related database operations
// code/src/services/pulse.service.js

import { prisma } from "../lib/prisma.js";
import { BadRequestError, ForbiddenError } from "../utils/api-error.js";

/**
 * Check if user is a student in the class
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} True if user is a student, false otherwise
 */
async function isStudentInClass(userId, classId) {
  const classRole = await prisma.classRole.findFirst({
    where: {
      userId,
      classId,
      role: "STUDENT",
    },
  });
  return !!classRole;
}

/**
 * Get today's date in PST (America/Los_Angeles) as a Date object (date only, no time)
 * @returns {Date} Today's date at midnight PST (stored as UTC in DB)
 */
function getTodayDate() {
  // Get current time in PST
  const pstNow = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });

  // Create a date object from the PST string
  const pstDate = new Date(pstNow);

  // Extract year, month, day in PST
  const year = pstDate.getFullYear();
  const month = pstDate.getMonth();
  const day = pstDate.getDate();

  // Create a new date at midnight PST
  // We need to create this as a UTC date that represents midnight PST
  // PST is UTC-8, PDT is UTC-7
  // We'll use a date string with PST offset
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Check if DST is in effect (2nd Sunday in March to 1st Sunday in November)
  const dateObj = new Date(year, month, day);
  const march = new Date(year, 2, 1); // March 1
  const november = new Date(year, 10, 1); // November 1

  // Find 2nd Sunday in March
  const marchDay = march.getDay();
  const secondSundayMarch = 14 - marchDay; // Days to add to get to 2nd Sunday

  // Find 1st Sunday in November
  const novDay = november.getDay();
  const firstSundayNov = 7 - novDay; // Days to add to get to 1st Sunday

  const dstStart = new Date(year, 2, secondSundayMarch);
  const dstEnd = new Date(year, 10, firstSundayNov);

  const isDST = dateObj >= dstStart && dateObj < dstEnd;

  // Use appropriate offset: -07:00 for PDT, -08:00 for PST
  const offset = isDST ? "-07:00" : "-08:00";

  // Create date at midnight PST/PDT
  const pstMidnight = new Date(`${dateStr}T00:00:00${offset}`);

  return pstMidnight;
}

/**
 * Submit or update a pulse entry for a student
 * @param {string} userId - User ID of the student
 * @param {string} classId - Class ID
 * @param {number} pulseValue - Pulse value (1-5)
 * @returns {Promise<Object>} Created or updated pulse entry
 * @throws {BadRequestError} If pulse value is invalid
 * @throws {ForbiddenError} If user is not a student in the class
 */
export async function submitPulse(userId, classId, pulseValue) {
  // Validate pulse value
  const pulse = parseInt(pulseValue, 10);
  if (isNaN(pulse) || pulse < 1 || pulse > 5) {
    throw new BadRequestError("Pulse value must be an integer between 1 and 5");
  }

  // Check if user is a student in the class
  const isStudent = await isStudentInClass(userId, classId);
  if (!isStudent) {
    throw new ForbiddenError(
      "Only students can submit pulse checks. You must be enrolled as a student in this class.",
    );
  }

  // Get today's date
  const today = getTodayDate();

  // Upsert pulse entry (insert or update if exists for today)
  const pulseEntry = await prisma.pulseEntry.upsert({
    where: {
      user_class_date_unique: {
        userId,
        classId,
        date: today,
      },
    },
    update: {
      value: pulse,
      updatedAt: new Date(),
    },
    create: {
      userId,
      classId,
      value: pulse,
      date: today,
    },
  });

  return pulseEntry;
}

/**
 * Get today's pulse entry for a student
 * @param {string} userId - User ID of the student
 * @param {string} classId - Class ID
 * @returns {Promise<Object|null>} Pulse entry with value, or null if not found
 * @throws {ForbiddenError} If user is not a student in the class
 */
export async function getTodayPulse(userId, classId) {
  // Check if user is a student in the class
  const isStudent = await isStudentInClass(userId, classId);
  if (!isStudent) {
    throw new ForbiddenError(
      "Only students can view their pulse checks. You must be enrolled as a student in this class.",
    );
  }

  // Get today's date
  const today = getTodayDate();

  // Find today's pulse entry
  const pulseEntry = await prisma.pulseEntry.findUnique({
    where: {
      user_class_date_unique: {
        userId,
        classId,
        date: today,
      },
    },
  });

  return pulseEntry;
}

/**
 * Check if user is a student in a class (public helper)
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} True if user is a student
 */
export async function checkIsStudent(userId, classId) {
  return isStudentInClass(userId, classId);
}

/**
 * Check if user is an instructor (professor, TA, or tutor) in the class
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object|null>} ClassRole object if instructor, null otherwise
 * @throws {ForbiddenError} If user is not an instructor
 */
export async function ensureUserIsInstructor(userId, classId) {
  const classRole = await prisma.classRole.findFirst({
    where: {
      userId,
      classId,
      role: {
        in: ["PROFESSOR", "TA", "TUTOR"],
      },
    },
  });

  if (!classRole) {
    throw new ForbiddenError(
      "Access denied. Only instructors (professor, TA, or tutor) can view pulse analytics.",
    );
  }

  return classRole;
}

/**
 * Get pulse analytics aggregated by day for a given time range
 * @param {string} classId - Class ID
 * @param {number} range - Number of days to look back (1, 7, or 30)
 * @returns {Promise<Array>} Array of {date, averagePulse, count} objects
 */
export async function getPulseAnalytics(classId, range) {
  // Validate range
  const validRanges = [1, 7, 30];
  if (!validRanges.includes(range)) {
    throw new BadRequestError("Range must be 1, 7, or 30 days");
  }

  // Get start date (today - range days) in PST
  const today = getTodayDate();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - range);

  // Query pulse entries grouped by date
  const analytics = await prisma.pulseEntry.groupBy({
    by: ["date"],
    where: {
      classId,
      date: {
        gte: startDate,
        lte: today,
      },
    },
    _avg: {
      value: true,
    },
    _count: {
      value: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Transform results to match expected format
  return analytics.map((item) => ({
    date: item.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
    averagePulse: item._avg.value ? parseFloat(item._avg.value.toFixed(2)) : 0,
    count: item._count.value,
  }));
}

/**
 * Get pulse details (individual student entries) for a specific date
 * @param {string} classId - Class ID
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of pulse entries with user information
 */
export async function getPulseDetails(classId, dateStr) {
  // Parse date string to Date object
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) {
    throw new BadRequestError("Invalid date format. Use YYYY-MM-DD");
  }

  // Query pulse entries for the specific date with user information
  const details = await prisma.pulseEntry.findMany({
    where: {
      classId,
      date,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  // Transform to include display name
  return details.map((entry) => ({
    userId: entry.userId,
    studentName: entry.user.preferredName || entry.user.name,
    pulse: entry.value,
    date: entry.date.toISOString().split("T")[0],
  }));
}

/**
 * Get average pulse for a given date range
 * @param {string} classId - Class ID
 * @param {number} range - Number of days to look back (1, 7, or 30)
 * @returns {Promise<number|null>} Average pulse value or null if no data
 */
export async function getAveragePulse(classId, range) {
  const today = getTodayDate();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - range);

  const result = await prisma.pulseEntry.aggregate({
    where: {
      classId,
      date: {
        gte: startDate,
        lte: today,
      },
    },
    _avg: {
      value: true,
    },
  });

  return result._avg.value ? parseFloat(result._avg.value.toFixed(2)) : null;
}
