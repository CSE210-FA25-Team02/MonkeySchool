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
 * route   GET /api/students
 * @description    Get all students with pagination (HTML response)
 * @access  Public
 */
router.get("/", asyncHandler(studentController.getAllStudents));

/**
 * route GET /api/students/new
 * @description    Show form to create a new student (HTML response)
 * @access  Public
 */
router.get("/new", asyncHandler(studentController.showCreateForm));

/**
 * route GET /api/students/:id
 * @description    Get student by ID (HTML response)
 * @access  Public
 */
router.get(
  "/:id",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.getStudentById),
);

/**
 * route   GET /api/students/:id/edit
 * @description    Show form to edit a student (HTML response)
 * @access  Public
 */
router.get(
  "/:id/edit",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.showEditForm),
);

/**
 * route   POST /api/students
 * @description    Create a new student (HTML response)
 * @access  Public
 */
router.post(
  "/",
  validate(createStudentSchema, "body"),
  asyncHandler(studentController.createStudent),
);

/**
 * route   PUT /api/students/:id
 * @description    Update a student (HTML response)
 * @access  Public
 */
router.put(
  "/:id",
  validate(studentIdSchema, "params"),
  validate(updateStudentSchema, "body"),
  asyncHandler(studentController.updateStudent),
);

/**
 * route   DELETE /api/students/:id
 * @description    Delete a student (HTML response or empty)
 * @access  Public
 */
router.delete(
  "/:id",
  validate(studentIdSchema, "params"),
  asyncHandler(studentController.deleteStudent),
);

export default router;
