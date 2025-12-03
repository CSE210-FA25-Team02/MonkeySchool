/**
 * Attendance Validation Schemas
 *
 * Zod schemas for validating attendance-related requests
 */

// code/src/validators/attendance.validator.js

import { z } from "zod";

/**
 * Schema for creating an attendance poll
 */
export const createPollSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(1440) // Max 24 hours
    .optional(),
});

/**
 * Schema for submitting attendance
 */
export const submitAttendanceSchema = z.object({
  code: z
    .string()
    .regex(/^\d{8}$/, "Code must be exactly 8 digits")
    .min(8)
    .max(8),
});

/**
 * Schema for marking attendance with course selection
 */
export const markAttendanceSchema = z.object({
  courseId: z.string().min(1, "Course selection is required"),
  code: z
    .string()
    .transform((val) => val.replace(/\s/g, "")) // Strip spaces first
    .refine((val) => /^\d{8}$/.test(val), "Code must be exactly 8 digits"),
});

/**
 * Schema for creating a course session
 */
export const createCourseSessionSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  name: z
    .string()
    .min(1, "Session name is required")
    .max(255, "Session name must not exceed 255 characters")
    .trim(),
  date: z.coerce.date(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
});

/**
 * Schema for session ID parameter
 */
export const sessionIdSchema = z.object({
  sessionId: z.string().regex(/^[a-z][a-z0-9]{7,31}$/),
});

/**
 * Schema for course ID parameter
 */
export const courseIdSchema = z.object({
  courseId: z.string().regex(/^[a-z][a-z0-9]{7,31}$/),
});

/**
 * Schema for poll ID parameter
 */
export const pollIdSchema = z.object({
  pollId: z.string().regex(/^[a-z][a-z0-9]{7,31}$/),
});
