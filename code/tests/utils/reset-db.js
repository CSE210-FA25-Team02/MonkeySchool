import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_HEADERS = [
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

const STUDENTS_HEADERS = [
  "id",
  "email",
  "name",
  "createdAt",
  "updatedAt",
];

/**
 * Reset test database by clearing CSV files
 * In test mode, we use CSV files instead of database
 */
export async function resetDatabase() {
  try {
    const dataDir = path.join(__dirname, "../../data");
    await fs.mkdir(dataDir, { recursive: true });

    const usersCSVFile = path.join(dataDir, "users.csv");
    await fs.writeFile(usersCSVFile, USERS_HEADERS.join(",") + "\n", "utf-8");

    const studentsCSVFile = path.join(dataDir, "students.csv");
    await fs.writeFile(studentsCSVFile, STUDENTS_HEADERS.join(",") + "\n", "utf-8");
  } catch (error) {
    console.error("Error resetting CSV database:", error);
    throw error;
  }
}
