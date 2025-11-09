/**
 * CSV User Service
 * Stores users in CSV file when USE_CSV_DB=true
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createId } from "@paralleldrive/cuid2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, "../../data/users.csv");
const CSV_DIR = path.dirname(CSV_FILE);

const CSV_HEADERS = [
  "id",
  "email",
  "name",
  "googleId",
  "photoUrl",
  "pronunciation",
  "pronouns",
  "phone",
  "github",
  "timezone",
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

async function readUsers() {
  await ensureCSVFile();
  const content = await fs.readFile(CSV_FILE, "utf-8");
  const lines = content.trim().split("\n");
  
  if (lines.length <= 1) {
    return [];
  }

  const users = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === CSV_HEADERS.length) {
      users.push({
        id: values[0],
        email: values[1],
        name: values[2],
        googleId: values[3] || null,
        photoUrl: values[4] || null,
        pronunciation: values[5] || null,
        pronouns: values[6] || null,
        phone: values[7] || null,
        github: values[8] || null,
        timezone: values[9] || null,
        createdAt: new Date(values[10]),
        updatedAt: new Date(values[11]),
        classRoles: [],
        groupRoles: [],
        groupSupervises: [],
      });
    }
  }
  return users;
}

async function writeUsers(users) {
  await ensureCSVFile();
  const lines = [CSV_HEADERS.join(",")];
  
  for (const user of users) {
    const values = [
      user.id,
      user.email || "",
      user.name || "",
      user.googleId || "",
      user.photoUrl || "",
      user.pronunciation || "",
      user.pronouns || "",
      user.phone || "",
      user.github || "",
      user.timezone || "",
      user.createdAt?.toISOString() || new Date().toISOString(),
      user.updatedAt?.toISOString() || new Date().toISOString(),
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

export async function createUser(data) {
  const users = await readUsers();
  
  const user = {
    id: createId(),
    email: data.email,
    name: data.name,
    googleId: data.googleId || null,
    photoUrl: data.photoUrl || null,
    pronunciation: data.pronunciation || null,
    pronouns: data.pronouns || null,
    phone: data.phone || null,
    github: data.github || null,
    timezone: data.timezone || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    classRoles: [],
    groupRoles: [],
    groupSupervises: [],
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

export async function getUserById(id) {
  const users = await readUsers();
  return users.find(u => u.id === id) || null;
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const users = await readUsers();
  const emailLower = email.toLowerCase();
  return users.find(u => u.email && u.email.toLowerCase() === emailLower) || null;
}

export async function getUserByGoogleId(googleId) {
  const users = await readUsers();
  return users.find(u => u.googleId === googleId) || null;
}

export async function updateUser(id, data) {
  const users = await readUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error(`User not found: ${id}`);
  }

  const user = users[index];
  const updatedUser = {
    ...user,
    ...data,
    updatedAt: new Date(),
  };

  users[index] = updatedUser;
  await writeUsers(users);
  return updatedUser;
}

export async function deleteUser(id) {
  const users = await readUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error(`User not found: ${id}`);
  }

  const user = users[index];
  users.splice(index, 1);
  await writeUsers(users);
  return user;
}

