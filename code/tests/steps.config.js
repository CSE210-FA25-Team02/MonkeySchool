// code/tests/steps.config.js

import supertest from "supertest";
import { createApp } from "../src/app.js";
import { context } from "./steps.context.js";
import { generateToken } from "../src/services/auth.service.js";
import { getUserByEmail, createUser } from "../src/services/user.service.js";

export const app = createApp();
const baseRequest = supertest(app);

// (auth helper will be defined below after ensuring default user exists)

// Ensure a default test user exists (top-level await is allowed in ESM test modules)
const DEFAULT_TEST_EMAIL = "test@ucsd.edu";
let defaultUser;
try {
  defaultUser = await getUserByEmail(DEFAULT_TEST_EMAIL);
  if (!defaultUser) {
    defaultUser = await createUser({
      name: "Test User",
      email: DEFAULT_TEST_EMAIL,
    });
  }
} catch {
  // ignore errors creating default user in test init
}

/**
 * Add an auth cookie to the given supertest request when a test user is available.
 * @param {import('supertest').Test} req - The supertest request to modify.
 * @returns {import('supertest').Test} The potentially modified request with auth cookie set.
 */
function withAuth(req) {
  try {
    // If test explicitly requests no auth, skip adding cookie
    if (context.skipAuth === true) return req;

    const user = context.user || defaultUser;
    if (user) {
      const token = generateToken(user);
      return req.set("Cookie", `auth_token=${token}`);
    }
  } catch {
    // If token generation fails, return the request without cookie
  }
  return req;
}

export const request = {
  /**
   * Send a GET request with optional auth cookie.
   * @param {string} path
   * @returns {import('supertest').Test}
   */
  get: (path) => withAuth(baseRequest.get(path)),

  /**
   * Send a POST request with optional auth cookie.
   * @param {string} path
   * @returns {import('supertest').Test}
   */
  post: (path) => withAuth(baseRequest.post(path)),

  /**
   * Send a PUT request with optional auth cookie.
   * @param {string} path
   * @returns {import('supertest').Test}
   */
  put: (path) => withAuth(baseRequest.put(path)),

  /**
   * Send a DELETE request with optional auth cookie.
   * @param {string} path
   * @returns {import('supertest').Test}
   */
  delete: (path) => withAuth(baseRequest.delete(path)),

  /**
   * Send a PATCH request with optional auth cookie.
   * @param {string} path
   * @returns {import('supertest').Test}
   */
  patch: (path) => withAuth(baseRequest.patch(path)),
};
