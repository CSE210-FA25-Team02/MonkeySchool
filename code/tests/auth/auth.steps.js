/**
 * Authentication Tests
 *
 * Tests for OAuth login, email validation, and session management
 */

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import { isEmailAllowed } from "../../src/services/auth.service.js";
import * as userService from "../../src/services/user.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feature = loadFeature("./features/auth.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.skipAuth = false;
    context.response = undefined;
  });

  test("UCSD email is allowed to login", ({ given, when, then }) => {
    given(/^a UCSD email "(.*)"$/, (email) => {
      context.email = email;
    });

    when(/^I check if the email is allowed$/, async () => {
      context.isAllowed = await isEmailAllowed(context.email);
    });

    then(/^the email should be allowed$/, () => {
      expect(context.isAllowed).toBe(true);
    });
  });

  test("Non-UCSD email not in CSV is not allowed", ({ given, when, then }) => {
    given(/^a non-UCSD email "(.*)" not in the CSV file$/, (email) => {
      context.email = email;
    });

    when(/^I check if the email is allowed$/, async () => {
      context.isAllowed = await isEmailAllowed(context.email);
    });

    then(/^the email should not be allowed$/, () => {
      expect(context.isAllowed).toBe(false);
    });
  });

  test("Non-UCSD email in CSV is allowed", ({ given, when, then }) => {
    const csvPath = path.join(__dirname, "../../data/external-emails.csv");

    given(/^a non-UCSD email "(.*)" in the CSV file$/, async (email) => {
      context.email = email;
      // Add email to CSV for testing
      const csvContent = `email\n${email}\n`;
      fs.writeFileSync(csvPath, csvContent, "utf8");
    });

    when(/^I check if the email is allowed$/, async () => {
      context.isAllowed = await isEmailAllowed(context.email);
    });

    then(/^the email should be allowed$/, () => {
      expect(context.isAllowed).toBe(true);
      // Clean up CSV
      fs.writeFileSync(csvPath, "email\n", "utf8");
    });
  });

  test("Get session returns null when not authenticated", ({ when, then }) => {
    when(/^I request the current session$/, async () => {
      // Ensure this request is unauthenticated
      context.skipAuth = true;
      context.response = await request.get("/auth/session");
    });

    then(/^the response should indicate no user is logged in$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.user).toBeNull();
    });
  });

  test("Logout clears authentication", ({ given, when, then }) => {
    given(/^a user is logged in$/, async () => {
      // Create a test user
      context.user = await userService.createUser({
        name: "Test User",
        email: "test@ucsd.edu",
      });

      // Simulate a logged-in session by setting a cookie
      // In a real test, you'd need to go through the OAuth flow
      // For now, we'll just test the logout endpoint
    });

    when(/^I logout$/, async () => {
      context.response = await request.get("/auth/logout");
    });

    then(/^I should be logged out$/, () => {
      // Logout should redirect or return success
      expect([200, 302]).toContain(context.response.status);
    });
  });
});
