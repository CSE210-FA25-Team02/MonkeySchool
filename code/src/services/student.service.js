/**
 * Student Service
 *
 * Business logic layer for student operations
 */

import { env } from "../config/env.js";
import { NotFoundError, ConflictError } from "../utils/api-error.js";

let csvService = null;
let prismaClient = null;

async function getCSVService() {
  if (!csvService) {
    const module = await import("./student.service.csv.js");
    csvService = module;
  }
  return csvService;
}

async function getPrismaClient() {
  if (!prismaClient) {
    const { prisma } = await import("../lib/prisma.js");
    prismaClient = prisma;
  }
  return prismaClient;
}

/**
 * Get all students with pagination
 */
export async function getAllStudents(page = 1, limit = 10) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.getAllStudents(page, limit);
  }
  const prisma = await getPrismaClient();
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
 */
export async function getStudentById(id) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.getStudentById(id);
  }
  const prisma = await getPrismaClient();
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
 */
export async function createStudent(data) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.createStudent(data);
  }
  const prisma = await getPrismaClient();
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
 */
export async function updateStudent(id, data) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.updateStudent(id, data);
  }
  const prisma = await getPrismaClient();
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
 */
export async function deleteStudent(id) {
  if (env.USE_CSV_DB) {
    const service = await getCSVService();
    return service.deleteStudent(id);
  }
  const prisma = await getPrismaClient();
  // Verify student exists
  await getStudentById(id);

  await prisma.student.delete({
    where: { id },
  });
}
