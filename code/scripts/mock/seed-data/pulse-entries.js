// code/scripts/mock/seed-data/pulse-entries.js
import { prisma } from "../../../src/lib/prisma.js";

/**
 * Get today's date in PST (America/Los_Angeles) as a Date object (date only, no time)
 * Matches the logic from pulse.service.js
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
 * Create a date object N days ago in PST
 * @param {number} daysAgo - Number of days to subtract
 * @returns {Date} Date at midnight PST
 */
function getDateNDaysAgo(daysAgo) {
  const today = getTodayDate();
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generate 100 pulse entries for students in Advanced Software Engineering and Project Management
 * @returns {Promise<number>} Number of pulse entries created
 */
export async function createPulseEntries() {
  console.log("Creating 100 pulse entries for Advanced Software Engineering and Project Management...");

  // Find the specific class
  const targetClass = await prisma.class.findFirst({
    where: {
      name: "Advanced Software Engineering and Project Management",
    },
    select: { id: true },
  });

  if (!targetClass) {
    console.log("Advanced Software Engineering and Project Management class not found. Skipping pulse entry creation.");
    return 0;
  }

  // Get only students enrolled in this specific class
  const studentRoles = await prisma.classRole.findMany({
    where: {
      role: "STUDENT",
      classId: targetClass.id,
    },
    select: {
      userId: true,
      classId: true,
    },
  });

  if (studentRoles.length === 0) {
    console.log("No students found in Advanced Software Engineering and Project Management. Skipping pulse entry creation.");
    return 0;
  }

  // Get list of student user IDs
  const studentUserIds = studentRoles.map((role) => role.userId);

  // Generate exactly 100 entries by randomly sampling from students and dates
  const entries = [];
  const targetCount = 100;
  const maxDaysAgo = 30; // Sample from the last 30 days

  // Use a seeded random for consistent results
  const random = seededRandom("pulse-seed-2025");

  // Generate 100 unique entries
  const usedCombinations = new Set();
  let attempts = 0;
  const maxAttempts = targetCount * 10; // Prevent infinite loops

  while (entries.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // Randomly select a student
    const randomStudentIdx = Math.floor(random() * studentUserIds.length);
    const userId = studentUserIds[randomStudentIdx];

    // Use the target class ID
    const classId = targetClass.id;

    // Randomly select a date from the last 30 days
    const daysAgo = Math.floor(random() * maxDaysAgo);
    const date = getDateNDaysAgo(daysAgo);

    // Create a unique key for this combination
    const combinationKey = `${userId}-${classId}-${date.toISOString()}`;

    // Skip if we've already created this combination
    if (usedCombinations.has(combinationKey)) continue;

    usedCombinations.add(combinationKey);

    // Generate random pulse value (1-5)
    // Slightly bias toward middle values (3-4) for realism
    let pulseValue;
    const rand = random();
    if (rand < 0.2) {
      pulseValue = 1; // 20% chance of low pulse
    } else if (rand < 0.4) {
      pulseValue = 2; // 20% chance of low-medium
    } else if (rand < 0.6) {
      pulseValue = 3; // 20% chance of medium
    } else if (rand < 0.85) {
      pulseValue = 4; // 25% chance of high-medium
    } else {
      pulseValue = 5; // 15% chance of high
    }

    entries.push({
      userId,
      classId,
      value: pulseValue,
      date,
    });
  }

  // Batch insert entries (handle duplicates gracefully with upsert)
  let createdCount = 0;
  const batchSize = 100;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    await Promise.all(
      batch.map((entry) =>
        prisma.pulseEntry.upsert({
          where: {
            user_class_date_unique: {
              userId: entry.userId,
              classId: entry.classId,
              date: entry.date,
            },
          },
          update: {
            value: entry.value,
          },
          create: {
            userId: entry.userId,
            classId: entry.classId,
            value: entry.value,
            date: entry.date,
          },
        }),
      ),
    );

    createdCount += batch.length;
  }

  console.log(`Created/updated ${createdCount} pulse entries`);
  return createdCount;
}

/**
 * Simple seeded random number generator for consistent results
 * @param {string} seed - Seed string
 * @returns {Function} Random function that returns values between 0 and 1
 */
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Simple LCG (Linear Congruential Generator)
  let state = Math.abs(hash);
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  return function () {
    state = (a * state + c) % m;
    return state / m;
  };
}

