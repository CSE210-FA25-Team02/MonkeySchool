/**
 * Environment Configuration
 *
 * Validates and provides type-safe access to environment variables
 */

import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(65535))
    .default("3000"),
  DATABASE_URL: z.string().url().optional(),
  USE_CSV_DB: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  CORS_ORIGIN: z.string().default("http://localhost:5500"),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default("100"),
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:3000/api/auth/google/callback"),
  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT Secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

// Validate DATABASE_URL only if not using CSV DB
if (!parsed.data.USE_CSV_DB && !parsed.data.DATABASE_URL) {
  console.error("❌ DATABASE_URL is required when USE_CSV_DB is false");
  throw new Error("DATABASE_URL is required");
}

export const env = parsed.data;
