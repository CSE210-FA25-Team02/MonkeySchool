import { prisma } from "../../../src/lib/prisma.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createDefaultCategories() {
  // Read activity categories from settings JSON file
  const settingsPath = join(
    __dirname,
    "../../../settings/activity-categories.json"
  );
  const fileContent = await readFile(settingsPath, "utf-8");
  const defaultCategories = JSON.parse(fileContent);

  for (const category of defaultCategories) {
    // Using upsert to avoid duplicates if running seed multiple times
    await prisma.activityCategory.upsert({
      where: { name: category.name },
      update: {}, // do nothing if it already exists
      create: category,
    });
  }

  console.log("Default activity categories created!");
}
