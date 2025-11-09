/**
 * CSV Student Service
 * Stores students in CSV file when USE_CSV_DB=true
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createId } from "@paralleldrive/cuid2";
import { NotFoundError, ConflictError } from "../utils/api-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, "../../data/students.csv");
const CSV_DIR = path.dirname(CSV_FILE);

const CSV_HEADERS = [
  "id",
  "email",
  "name",
  "createdAt",
  "updatedAt",
];

async function ensureCSVFile() {
  try {
    await fs.mkdir(CSV_DIR, { recursive: true });
    try {
      await fs.access(CSV_FILE);
    } catch {
      await fs.writeFile(CSV_FILE, CSV_HEADERS.join(",") + "\n");
    }
  } catch (error) {
    console.error("Error ensuring CSV file:", error);
    throw error;
  }
}

async function readStudents() {
  await ensureCSVFile();
  const content = await fs.readFile(CSV_FILE, "utf-8");
  const lines = content.trim().split("\n");
  
  if (lines.length <= 1) {
    return [];
  }

  const students = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === CSV_HEADERS.length) {
      students.push({
        id: values[0],
        email: values[1],
        name: values[2],
        createdAt: new Date(values[3]),
        updatedAt: new Date(values[4]),
      });
    }
  }
  return students;
}

async function writeStudents(students) {
  await ensureCSVFile();
  const lines = [CSV_HEADERS.join(",")];
  
  for (const student of students) {
    const values = [
      student.id,
      student.email || "",
      student.name || "",
      student.createdAt?.toISOString() || new Date().toISOString(),
      student.updatedAt?.toISOString() || new Date().toISOString(),
    ];
    lines.push(values.map(escapeCSV).join(","));
  }
  
  await fs.writeFile(CSV_FILE, lines.join("\n") + "\n");
}

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function getAllStudents(page = 1, limit = 10) {
  const students = await readStudents();
  const skip = (page - 1) * limit;
  const total = students.length;
  
  // Sort by createdAt descending
  const sorted = students.sort((a, b) => b.createdAt - a.createdAt);
  const paginated = sorted.slice(skip, skip + limit);

  return {
    students: paginated,
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getStudentById(id) {
  const students = await readStudents();
  const student = students.find(s => s.id === id);
  
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  return student;
}

export async function createStudent(data) {
  const students = await readStudents();
  
  // Check if email already exists
  const existingStudent = students.find(s => s.email === data.email);
  if (existingStudent) {
    throw new ConflictError("A student with this email already exists");
  }

  const student = {
    id: createId(),
    email: data.email,
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  students.push(student);
  await writeStudents(students);
  return student;
}

export async function updateStudent(id, data) {
  const students = await readStudents();
  const index = students.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new NotFoundError("Student not found");
  }

  // If email is being updated, check if it's already taken
  if (data.email) {
    const existingStudent = students.find(s => s.email === data.email && s.id !== id);
    if (existingStudent) {
      throw new ConflictError("A student with this email already exists");
    }
  }

  const student = students[index];
  const updatedStudent = {
    ...student,
    ...data,
    updatedAt: new Date(),
  };

  students[index] = updatedStudent;
  await writeStudents(students);
  return updatedStudent;
}

export async function deleteStudent(id) {
  const students = await readStudents();
  const index = students.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new NotFoundError("Student not found");
  }

  students.splice(index, 1);
  await writeStudents(students);
}

