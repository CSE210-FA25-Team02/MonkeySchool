/**
 * Jest Setup File
 * Sets up test environment variables before tests run
 * This ensures all required environment variables are available during testing
 */

// Set NODE_ENV to test
process.env.NODE_ENV = process.env.NODE_ENV || "test";

// Set required test environment variables if not already set
// These values are used only for testing and don't need to be real credentials
if (!process.env.GOOGLE_CLIENT_ID) {
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id-12345678901234567890";
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret-12345678901234567890";
}

if (!process.env.JWT_SECRET) {
  // Generate a test JWT secret that meets the 32 character minimum
  process.env.JWT_SECRET = "test-jwt-secret-key-minimum-32-characters-long-for-testing-purposes";
}

if (!process.env.GOOGLE_REDIRECT_URI) {
  process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
}

if (!process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN = "http://localhost:5500";
}

if (!process.env.RATE_LIMIT_WINDOW_MS) {
  process.env.RATE_LIMIT_WINDOW_MS = "900000";
}

if (!process.env.RATE_LIMIT_MAX_REQUESTS) {
  process.env.RATE_LIMIT_MAX_REQUESTS = "100";
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = "7d";
}

if (!process.env.PORT) {
  process.env.PORT = "3000";
}

// Use CSV database for tests (no database connection required)
if (!process.env.USE_CSV_DB) {
  process.env.USE_CSV_DB = "true";
}

// DATABASE_URL is not required when using CSV DB, but set a dummy value to avoid validation errors
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy?schema=public";
}

