/**
 * Student Routes - HTMX Edition
 *
 * Defines all student-related endpoints for HTMX responses
 */

// code/src/routes/student.routes.js

import { Router } from "express";
import * as studentController from "../controllers/student.controller.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdSchema,
} from "../validators/student.validator.js";

const router = Router();

/**
 * @route   GET /students
 * @desc    Get all students with pagination (HTML response)
 * @access  Public
 */
router.get("/", asyncHandler(studentController.getAllStudents));

/**
 * @route   GET /students/new
 * @desc    Show form to create a new student (HTML response)
 * @access  Public
 */
router.get("/new", asyncHandler(studentController.showCreateForm));

/**
 * @route   GET /students/:id
 * @desc    Get student by ID (HTML response)
 * @access  Public
 */
router.get(
  "/:id",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.getStudentById)
);

/**
 * @route   GET /students/:id/edit
 * @desc    Show form to edit a student (HTML response)
 * @access  Public
 */
router.get(
  "/:id/edit",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.showEditForm)
);

/**
 * @route   POST /students
 * @desc    Create a new student (HTML response)
 * @access  Public
 */
router.post(
  "/",
  validate(createStudentSchema, "body"),
  asyncHandler(studentController.createStudent)
);

/**
 * @route   PUT /students/:id
 * @desc    Update a student (HTML response)
 * @access  Public
 */
router.put(
  "/:id",
  validate(studentIdSchema, "params"),
  validate(updateStudentSchema, "body"),
  asyncHandler(studentController.updateStudent)
);

/**
 * @route   DELETE /students/:id
 * @desc    Delete a student (HTML response or empty)
 * @access  Public
 */
router.delete(
  "/:id",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.deleteStudent)
);

export default router;
