/**
 * Student Service
 *
 * Business logic layer for student operations
 */

import { prisma } from "../lib/prisma.js";
import { NotFoundError, ConflictError } from "../utils/api-error.js";

/**
 * Get all students with pagination
 * @param {number} [page=1] Page number
 * @param {number} [limit=10] Items per page
 * @returns {Promise<Object>} Object with student list
 */
export async function getAllStudents(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count(),
  ]);

  return {
    students,
    total,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get a single student by ID
 * @param {string} id Student ID
 * @returns {Promise<Object>} Student object
 * @throws {NotFoundError} If student not found
 */
export async function getStudentById(id) {
  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    throw new NotFoundError("Student not found");
  }

  return student;
}

/**
 * Create a new student
 * @param {Object} data Student data (name, email, etc.)
 * @returns {Promise<Object>} Created student object
 * @throws {ConflictError} If email already exists
 */
export async function createStudent(data) {
  // Check if email already exists
  const existingStudent = await prisma.student.findUnique({
    where: { email: data.email },
  });

  if (existingStudent) {
    throw new ConflictError("A student with this email already exists");
  }

  const student = await prisma.student.create({
    data,
  });

  return student;
}

/**
 * Update a student
 * @param {string} id Student ID
 * @param {Object} data Update data
 * @returns {Promise<Object>} Updated student object
 * @throws {NotFoundError} If student not found
 * @throws {ConflictError} If email already exists
 */
export async function updateStudent(id, data) {
  // Verify student exists
  await getStudentById(id);

  // If email is being updated, check if it's already taken
  if (data.email) {
    const existingStudent = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (existingStudent && existingStudent.id !== id) {
      throw new ConflictError("A student with this email already exists");
    }
  }

  const student = await prisma.student.update({
    where: { id },
    data,
  });

  return student;
}

/**
 * Delete a student
 * @param {string} id Student ID
 * @returns {Promise<void>}
 * @throws {NotFoundError} If student not found
 */
export async function deleteStudent(id) {
  // Verify student exists
  await getStudentById(id);

  await prisma.student.delete({
    where: { id },
  });
}
