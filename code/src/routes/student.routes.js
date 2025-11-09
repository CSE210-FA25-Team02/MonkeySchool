/**
 * Student Routes - HTMX Edition
 *
 * Defines all student-related endpoints for HTMX responses
 */

import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import { validate } from "../middleware/validate.js";
import { validateCsrf } from "../middleware/csrf.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdSchema,
} from "../validators/student.validator.js";

const router = Router();

/**
 * @route   GET /api/students
 * @desc    Get all students with pagination (HTML response)
 * @access  Public
 */
router.get("/", asyncHandler(studentController.getAllStudents));

/**
 * @route   GET /api/students/new
 * @desc    Show form to create a new student (HTML response)
 * @access  Public
 */
router.get("/new", asyncHandler(studentController.showCreateForm));

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID (HTML response)
 * @access  Public
 */
router.get(
  "/:id",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.getStudentById),
);

/**
 * @route   GET /api/students/:id/edit
 * @desc    Show form to edit a student (HTML response)
 * @access  Public
 */
router.get(
  "/:id/edit",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.showEditForm),
);

/**
 * @route   POST /api/students
 * @desc    Create a new student (HTML response)
 * @access  Public
 */
router.post(
  "/",
  validateCsrf,
  validate(createStudentSchema, "body"),
  asyncHandler(studentController.createStudent),
);

/**
 * @route   PUT /api/students/:id
 * @desc    Update a student (HTML response)
 * @access  Public
 */
router.put(
  "/:id",
  validateCsrf,
  validate(studentIdSchema, "params"),
  validate(updateStudentSchema, "body"),
  asyncHandler(studentController.updateStudent),
);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete a student (HTML response or empty)
 * @access  Public
 */
router.delete(
  "/:id",
  validateCsrf,
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.deleteStudent),
);

export default router;
