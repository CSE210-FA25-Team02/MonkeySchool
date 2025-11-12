/**
 * Student Controller - HTMX Edition
 *
 * HTTP request handlers for student endpoints that return HTML for HTMX
 */

import * as studentService from "../services/student.service.js";
import {
  createStudentList,
  createStudentForm,
  createStudentCard,
  createErrorMessage,
  createSuccessMessage,
  createBaseLayout,
} from "../utils/html-templates.js";

/**
 * GET /students
 * Get all students with pagination - returns HTML
 */
export async function getAllStudents(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const isHtmxRequest = req.headers["hx-request"];

  try {
    const result = await studentService.getAllStudents(page, limit);

    const pagination = {
      page,
      limit,
      total: result.total,
      pages: result.pages,
    };

    const studentsHtml = createStudentList(result.students, pagination, {
      editable: true,
    });

    if (isHtmxRequest) {
      // Return partial HTML for HTMX requests
      res.send(studentsHtml);
    } else {
      // Return full page for direct navigation
      const fullPage = createBaseLayout(
        "Students - Student Management System",
        studentsHtml
      );
      res.send(fullPage);
    }
  } catch (error) {
    console.error("Error loading students:", error);
    const errorHtml = createErrorMessage(
      "Failed to load students because of a server error."
    );

    if (isHtmxRequest) {
      res.status(500).send(errorHtml);
    } else {
      const fullPage = createBaseLayout(
        "Error - Student Management System",
        errorHtml
      );
      res.status(500).send(fullPage);
    }
  }
}

/**
 * GET /students/:id
 * Get a single student by ID - returns HTML
 */
export async function getStudentById(req, res) {
  const isHtmxRequest = req.headers["hx-request"];

  try {
    const student = await studentService.getStudentById(req.params.id);
    const studentHtml = createStudentCard(student, { editable: true });

    if (isHtmxRequest) {
      res.send(studentHtml);
    } else {
      const fullPage = createBaseLayout(
        `${student.name} - Student Management System`,
        studentHtml
      );
      res.send(fullPage);
    }
  } catch (error) {
    const errorHtml = createErrorMessage(
      error.statusCode === 404
        ? "Student not found."
        : "Failed to load student."
    );

    const statusCode = error.statusCode || 500;

    if (isHtmxRequest) {
      res.status(statusCode).send(errorHtml);
    } else {
      const fullPage = createBaseLayout(
        "Error - Student Management System",
        errorHtml
      );
      res.status(statusCode).send(fullPage);
    }
  }
}

/**
 * GET /students/new
 * Show form to create a new student - returns HTML
 */
export async function showCreateForm(req, res) {
  const isHtmxRequest = req.headers["hx-request"];
  const formHtml = createStudentForm();

  if (isHtmxRequest) {
    res.send(formHtml);
  } else {
    const fullPage = createBaseLayout(
      "Add New Student - Student Management System",
      formHtml
    );
    res.send(fullPage);
  }
}

/**
 * GET /students/:id/edit
 * Show form to edit a student - returns HTML
 */
export async function showEditForm(req, res) {
  const isHtmxRequest = req.headers["hx-request"];

  try {
    const student = await studentService.getStudentById(req.params.id);
    const formHtml = createStudentForm(student);

    if (isHtmxRequest) {
      res.send(formHtml);
    } else {
      const fullPage = createBaseLayout(
        `Edit ${student.name} - Student Management System`,
        formHtml
      );
      res.send(fullPage);
    }
  } catch (error) {
    const errorHtml = createErrorMessage(
      error.statusCode === 404
        ? "Student not found."
        : "Failed to load student for editing."
    );

    const statusCode = error.statusCode || 500;

    if (isHtmxRequest) {
      res.status(statusCode).send(errorHtml);
    } else {
      const fullPage = createBaseLayout(
        "Error - Student Management System",
        errorHtml
      );
      res.status(statusCode).send(fullPage);
    }
  }
}

/**
 * POST /students
 * Create a new student - returns HTML
 */
export async function createStudent(req, res) {
  const isHtmxRequest = req.headers["hx-request"];

  try {
    const student = await studentService.createStudent(req.body);

    // Return success message with the new student list
    const result = await studentService.getAllStudents(1, 10);
    const pagination = {
      page: 1,
      limit: 10,
      total: result.total,
      pages: result.pages,
    };

    const successMessage = createSuccessMessage(
      `Student "${student.name}" has been created successfully.`
    );
    const studentsHtml = createStudentList(result.students, pagination, {
      editable: true,
    });
    const combinedHtml = successMessage + studentsHtml;

    if (isHtmxRequest) {
      res.status(201).send(combinedHtml);
    } else {
      const fullPage = createBaseLayout(
        "Students - Student Management System",
        combinedHtml
      );
      res.status(201).send(fullPage);
    }
  } catch (error) {
    let errorMessage = "Failed to create student.";

    if (error.statusCode === 409) {
      errorMessage = "A student with this email already exists.";
    } else if (error.statusCode === 400) {
      errorMessage = "Please check your input and try again.";
    }

    const errorHtml = createErrorMessage(errorMessage);
    const formHtml = createStudentForm(req.body);
    const combinedHtml = errorHtml + formHtml;

    const statusCode = error.statusCode || 500;

    if (isHtmxRequest) {
      res.status(statusCode).send(combinedHtml);
    } else {
      const fullPage = createBaseLayout(
        "Add New Student - Student Management System",
        combinedHtml
      );
      res.status(statusCode).send(fullPage);
    }
  }
}

/**
 * PUT /students/:id
 * Update a student - returns HTML
 */
export async function updateStudent(req, res) {
  const isHtmxRequest = req.headers["hx-request"];

  try {
    const student = await studentService.updateStudent(req.params.id, req.body);

    // Return success message with updated student list
    const result = await studentService.getAllStudents(1, 10);
    const pagination = {
      page: 1,
      limit: 10,
      total: result.total,
      pages: result.pages,
    };

    const successMessage = createSuccessMessage(
      `Student "${student.name}" has been updated successfully.`
    );
    const studentsHtml = createStudentList(result.students, pagination, {
      editable: true,
    });
    const combinedHtml = successMessage + studentsHtml;

    if (isHtmxRequest) {
      res.send(combinedHtml);
    } else {
      const fullPage = createBaseLayout(
        "Students - Student Management System",
        combinedHtml
      );
      res.send(fullPage);
    }
  } catch (error) {
    let errorMessage = "Failed to update student.";

    if (error.statusCode === 404) {
      errorMessage = "Student not found.";
    } else if (error.statusCode === 409) {
      errorMessage = "A student with this email already exists.";
    } else if (error.statusCode === 400) {
      errorMessage = "Please check your input and try again.";
    }

    const errorHtml = createErrorMessage(errorMessage);

    // Try to get the student for the form, fall back to request body
    let formData = req.body;
    try {
      const existingStudent = await studentService.getStudentById(
        req.params.id
      );
      formData = { ...existingStudent, ...req.body };
    } catch {
      // Use request body if student not found
    }

    const formHtml = createStudentForm(formData);
    const combinedHtml = errorHtml + formHtml;

    const statusCode = error.statusCode || 500;

    if (isHtmxRequest) {
      res.status(statusCode).send(combinedHtml);
    } else {
      const fullPage = createBaseLayout(
        "Edit Student - Student Management System",
        combinedHtml
      );
      res.status(statusCode).send(fullPage);
    }
  }
}

/**
 * DELETE /students/:id
 * Delete a student - returns HTML or empty response
 */
export async function deleteStudent(req, res) {
  const isHtmxRequest = req.headers["hx-request"];

  try {
    await studentService.deleteStudent(req.params.id);

    if (isHtmxRequest) {
      // For HTMX, return empty content to replace the deleted element
      res.send("");
    } else {
      // For direct requests, redirect to student list
      res.redirect("/students");
    }
  } catch (error) {
    const errorHtml = createErrorMessage(
      error.statusCode === 404
        ? "Student not found."
        : "Failed to delete student."
    );

    const statusCode = error.statusCode || 500;

    if (isHtmxRequest) {
      res.status(statusCode).send(errorHtml);
    } else {
      const fullPage = createBaseLayout(
        "Error - Student Management System",
        errorHtml
      );
      res.status(statusCode).send(fullPage);
    }
  }
}
