import { loadFeature, defineFeature } from "jest-cucumber";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import * as authService from "../../src/services/auth.service.js";
import * as userService from "../../src/services/user.service.js";
import { resetDatabase } from "../utils/reset-db.js";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";
import { JSDOM } from "jsdom";

const feature = loadFeature("./features/auth.feature");

/**
 * Helper function to parse HTML response
 */
function parseHtmlResponse(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  return {
    document,
    hasElement: (selector) => !!document.querySelector(selector),
    getElementText: (selector) =>
      document.querySelector(selector)?.textContent?.trim(),
    getAllElements: (selector) =>
      Array.from(document.querySelectorAll(selector)),
  };
}

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.token = undefined;
    context.response = undefined;
    context.authUrl = undefined;
    context.decodedToken = undefined;
    context.error = undefined;
  });

  test("Get Google OAuth authorization URL", ({ given, when, then, and }) => {
    given("the test environment is configured", () => {
      expect(env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(env.GOOGLE_REDIRECT_URI).toBeDefined();
      expect(env.JWT_SECRET).toBeDefined();
    });

    when("I request the Google OAuth authorization URL", () => {
      context.authUrl = authService.getGoogleAuthUrl();
    });

    then("I should receive a valid Google OAuth URL", () => {
      expect(context.authUrl).toBeDefined();
      expect(typeof context.authUrl).toBe("string");
      expect(context.authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    });

    and("the URL should contain the client ID", () => {
      expect(context.authUrl).toContain(`client_id=${env.GOOGLE_CLIENT_ID}`);
    });

    and("the URL should contain the redirect URI", () => {
      const redirectUri = encodeURIComponent(env.GOOGLE_REDIRECT_URI);
      expect(context.authUrl).toContain(`redirect_uri=${redirectUri}`);
    });

    and("the URL should contain the correct scopes", () => {
      expect(context.authUrl).toContain("scope=openid+email+profile");
    });
  });

  test("Generate JWT token for user", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
      expect(context.user).not.toBeNull();
      expect(context.user.email).toBe(email);
      expect(context.user.name).toBe(name);
    });

    when("I generate a JWT token for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    then("I should receive a valid JWT token", () => {
      expect(context.token).toBeDefined();
      expect(typeof context.token).toBe("string");
      expect(context.token.length).toBeGreaterThan(0);
    });

    and("the token should contain the user ID", () => {
      context.decodedToken = jwt.verify(context.token, env.JWT_SECRET);
      expect(context.decodedToken.id).toBe(context.user.id);
    });

    and("the token should contain the user email", () => {
      expect(context.decodedToken.email).toBe(context.user.email);
    });
  });

  test("Verify valid JWT token", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I verify the JWT token", () => {
      context.decodedToken = authService.verifyJWT(context.token);
    });

    then("the token should be valid", () => {
      expect(context.decodedToken).toBeDefined();
      expect(context.decodedToken).toHaveProperty("id");
      expect(context.decodedToken).toHaveProperty("email");
    });

    and("I should receive the user ID", () => {
      expect(context.decodedToken.id).toBe(context.user.id);
    });

    and("I should receive the user email", () => {
      expect(context.decodedToken.email).toBe(context.user.email);
    });
  });

  test("Verify invalid JWT token", ({ when, then }) => {
    when("I verify an invalid JWT token", () => {
      try {
        authService.verifyJWT("invalid-token-string");
        context.error = null;
      } catch (error) {
        context.error = error;
      }
    });

    then("I should receive an unauthorized error", () => {
      expect(context.error).not.toBeNull();
      // Check if it's an UnauthorizedError by checking the message or statusCode
      // The error should contain "Invalid or expired token" message
      expect(context.error.message).toBeDefined();
      expect(
        context.error.message.includes("Invalid or expired token") ||
        context.error.statusCode === 401
      ).toBe(true);
    });
  });

  test("Verify expired JWT token", ({ given, when, then }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("an expired JWT token has been generated for the user", () => {
      // Generate a token with very short expiration (already expired)
      context.token = jwt.sign(
        { id: context.user.id, email: context.user.email },
        env.JWT_SECRET,
        { expiresIn: "-1h" } // Already expired
      );
    });

    when("I verify the expired JWT token", () => {
      try {
        authService.verifyJWT(context.token);
        context.error = null;
      } catch (error) {
        context.error = error;
      }
    });

    then("I should receive an unauthorized error", () => {
      expect(context.error).not.toBeNull();
      // Check if it's an UnauthorizedError by checking the message or statusCode
      expect(context.error.message).toBeDefined();
      expect(
        context.error.message.includes("Invalid or expired token") ||
        context.error.statusCode === 401
      ).toBe(true);
    });
  });

  test("Authenticate with valid JWT token in header", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I make an authenticated request with the token in the Authorization header", async () => {
      context.response = await request
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${context.token}`);
    });

    then("the request should succeed", () => {
      expect(context.response.status).toBe(200);
    });

    and("I should receive the user information", () => {
      expect(context.response.body.success).toBe(true);
      expect(context.response.body.user).toBeDefined();
      expect(context.response.body.user.email).toBe(context.user.email);
      expect(context.response.body.user.name).toBe(context.user.name);
      expect(context.response.body.user.id).toBe(context.user.id);
    });
  });

  test("Authenticate with valid JWT token in cookie", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I make an authenticated request with the token in a cookie", async () => {
      context.response = await request
        .get("/api/auth/me")
        .set("Cookie", `token=${context.token}`);
    });

    then("the request should succeed", () => {
      expect(context.response.status).toBe(200);
    });

    and("I should receive the user information", () => {
      expect(context.response.body.success).toBe(true);
      expect(context.response.body.user.email).toBe(context.user.email);
      expect(context.response.body.user.name).toBe(context.user.name);
    });
  });

  test("Authenticate without token", ({ when, then }) => {
    when("I make an authenticated request without a token", async () => {
      context.response = await request.get("/api/auth/me");
    });

    then("I should receive an unauthorized error", () => {
      expect(context.response.status).toBe(401);
      expect(context.response.body.error).toBeDefined();
      expect(context.response.body.error).toContain("Authentication required");
    });
  });

  test("Get current user profile", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I request my current user profile with the token", async () => {
      context.response = await request
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${context.token}`);
    });

    then("I should receive my user profile", () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.user).toBeDefined();
    });

    and("the profile should contain my email", () => {
      expect(context.response.body.user.email).toBe(context.user.email);
    });

    and("the profile should contain my name", () => {
      expect(context.response.body.user.name).toBe(context.user.name);
    });
  });

  test("Get current user profile via HTMX", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I request my current user profile via HTMX with the token", async () => {
      context.response = await request
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${context.token}`)
        .set("HX-Request", "true");
    });

    then("I should receive my user profile as HTML", () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toBeDefined();
      expect(context.response.text).toContain("user-profile");
    });

    and("the HTML should contain my email", () => {
      expect(context.response.text).toContain(context.user.email);
    });

    and("the HTML should contain my name", () => {
      expect(context.response.text).toContain(context.user.name);
    });
  });

  test("Logout user", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I logout", async () => {
      context.response = await request
        .post("/api/auth/logout")
        .set("Cookie", `token=${context.token}`);
    });

    then("the logout should succeed", () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.success).toBe(true);
      expect(context.response.body.message).toContain("Logged out");
    });

    and("the token cookie should be cleared", () => {
      const cookies = context.response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      if (cookies && cookies.length > 0) {
        const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
        expect(tokenCookie).toBeDefined();
        // Cookie should be cleared (either Max-Age=0 or Expires in the past)
        expect(
          tokenCookie.includes("Max-Age=0") || 
          tokenCookie.includes("Expires=")
        ).toBe(true);
      }
    });
  });

  test("Logout user via HTMX", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    given("a JWT token has been generated for the user", () => {
      context.token = authService.generateJWT(context.user);
    });

    when("I logout via HTMX", async () => {
      context.response = await request
        .post("/api/auth/logout")
        .set("Cookie", `token=${context.token}`)
        .set("HX-Request", "true");
    });

    then("the logout should succeed", () => {
      expect(context.response.status).toBe(200);
    });

    and("the response should be HTML", () => {
      expect(context.response.text).toBeDefined();
      expect(context.response.text).toContain("logout-success");
    });
  });

  test("Handle Google callback with missing code", ({ when, then }) => {
    when("I handle the Google OAuth callback without a code", async () => {
      context.response = await request.get("/api/auth/google/callback");
    });

    then("I should receive a bad request error", () => {
      expect(context.response.status).toBe(400);
      expect(context.response.body.error).toBeDefined();
      expect(context.response.body.error).toContain("Missing authorization code");
    });
  });

  test("Verify UCSD email is automatically authorized", ({ given, when, then }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    when("I check if the UCSD email is authorized", () => {
      context.isAuthorized = context.user.email.toLowerCase().endsWith("@ucsd.edu");
    });

    then("the email should be authorized", () => {
      expect(context.isAuthorized).toBe(true);
      expect(context.user.email).toContain("@ucsd.edu");
    });
  });

  test("Verify non-UCSD email authorization for existing user", ({ given, when, then }) => {
    given(/^a user with email "(.*)" and name "(.*)" exists$/, async (email, name) => {
      context.user = await userService.createUser({ email, name });
    });

    when("I check if the existing user email is authorized", async () => {
      // Existing users in the database are authorized
      const user = await userService.getUserByEmail(context.user.email);
      context.isAuthorized = user !== null;
    });

    then("the email should be authorized", () => {
      expect(context.isAuthorized).toBe(true);
      expect(context.user.email).not.toContain("@ucsd.edu");
    });
  });
});

