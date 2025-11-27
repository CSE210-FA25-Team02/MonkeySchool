/**
 * Secure Code Generator for Attendance Polls
 *
 * Generates unique 8-digit numeric codes for attendance polls.
 * Uses crypto-secure random number generation with retry logic for uniqueness.
 */

import { randomInt } from "crypto";

const MAX_RETRIES = 10;
const CODE_LENGTH = 8;
const MIN_CODE = 0;
const MAX_CODE = 99999999; // 8 digits max

/**
 * Generate a secure random 8-digit code (zero-padded)
 * @returns {string} 8-digit code as string (e.g., "08374211")
 */
function generateCode() {
  const code = randomInt(MIN_CODE, MAX_CODE + 1);
  return code.toString().padStart(CODE_LENGTH, "0");
}

/**
 * Generate a unique attendance code with retry logic
 * @param {Function} uniquenessChecker - Async function that returns true if code is unique
 * @returns {Promise<string>} Unique 8-digit code
 * @throws {Error} If unable to generate unique code after MAX_RETRIES attempts
 */
export async function generateUniqueCode(uniquenessChecker) {
  if (typeof uniquenessChecker !== "function") {
    throw new Error("uniquenessChecker must be a function");
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    const isUnique = await uniquenessChecker(code);

    if (isUnique) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate unique code after ${MAX_RETRIES} attempts`,
  );
}

/**
 * Validate that a code is in the correct format (8 digits)
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid
 */
export function validateCodeFormat(code) {
  if (typeof code !== "string") {
    return false;
  }
  return /^\d{8}$/.test(code);
}
