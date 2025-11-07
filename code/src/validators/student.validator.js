/**
 * Student Validation Schemas
 *
 * Zod schemas for validating student-related requests
 */

// code/src/validators/student.validator.js

import { z } from "zod";

/**
 * Schema for creating a new student
 */
export const createStudentSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .min(3, "Email must be at least 3 characters")
    .max(255, "Email must not exceed 255 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .trim(),
});

/**
 * Schema for updating a student
 */
export const updateStudentSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .min(3, "Email must be at least 3 characters")
      .max(255, "Email must not exceed 255 characters")
      .optional(),
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must not exceed 255 characters")
      .trim()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Schema for student ID parameter
 */
export const studentIdSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]{7,31}$/),
});
