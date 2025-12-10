/**
 * Authentication Controller
 *
 * Handles OAuth login, callback, logout, and session management
 */

import {
  getOrCreateUser,
  generateToken,
  verifyToken,
} from "../services/auth.service.js";
import { getUserById } from "../services/user.service.js";
import { env } from "../config/env.js";

/**
 * Initiate Google OAuth login
 * @param {Object} req Incoming HTTP request
 * @param {Object} res HTTP response used for redirection
 * @returns {Promise<void>}
 */
export async function login(req, res) {
  // Construct redirect URI - ensure no trailing slash on base URL
  const baseUrl = env.AUTH_BASE_URL.replace(/\/$/, "");
  const redirectUri = `${baseUrl}/auth/callback`;

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // If HTMX, return a script to redirect client
  if (req.headers["hx-request"]) {
    res.set("Content-Type", "text/html");
    return res.send(`<script>window.location.href = '${authUrl}';</script>`);
  }
  // Otherwise, normal redirect
  res.redirect(authUrl);
}

/**
 * Handle OAuth callback from Google
 * @param {Object} req Incoming HTTP request containing OAuth code
 * @param {Object} res HTTP response used for redirection
 * @returns {Promise<void>}
 */
export async function callback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect("/?error=no_code");
    }

    // Construct redirect URI - ensure no trailing slash on base URL
    const baseUrl = env.AUTH_BASE_URL.replace(/\/$/, "");
    const redirectUri = `${baseUrl}/auth/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange error:", error);
      return res.redirect("/?error=token_exchange_failed");
    }

    const tokens = await tokenResponse.json();
    const { access_token } = tokens;

    // Get user profile from Google
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    if (!profileResponse.ok) {
      return res.redirect("/?error=profile_fetch_failed");
    }

    const profile = await profileResponse.json();

    // Validate email and get/create user
    const user = await getOrCreateUser(profile);

    // Generate JWT token
    const token = generateToken(user);

    // Set cookie with token
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to homepage
    res.redirect("/");
  } catch (error) {
    console.error("OAuth callback error:", error);

    if (error.message.includes("not authorized")) {
      return res.redirect("/?error=email_not_authorized");
    }

    res.redirect("/?error=login_failed");
  }
}

/**
 * Logout user
 * @param {Object} req Incoming HTTP request
 * @param {Object} res HTTP response
 * @returns {Promise<void>}
 */
export async function logout(req, res) {
  res.clearCookie("auth_token");

  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    res.set("Content-Type", "text/html");
    const logoutHtml = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #0E534A 0%, #1B6A59 100%);">
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); text-align: center; max-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 20px;">👋</div>
          <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">Logged out successfully</h2>
          <p style="color: #666; margin: 0 0 30px 0; line-height: 1.6;">You have been safely logged out. Redirecting...</p>
          <div style="width: 40px; height: 40px; border: 4px solid #F2A93B; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;" id="spinner"></div>
        </div>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </div>
      <script>
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      </script>
    `;
    res.send(logoutHtml);
  } else {
    res.redirect("/");
  }
}

/**
 * Get current user session
 * @param {Object} req Incoming HTTP request
 * @param {Object} res HTTP response returning user JSON
 * @returns {Promise<void>}
 */
export async function getSession(req, res) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.json({ user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({ user: null });
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.json({ user: null });
    }

    // Don't send sensitive data
    const { id, email, name, photoUrl } = user;
    res.json({ user: { id, email, name, photoUrl } });
  } catch (error) {
    console.error("Get session error:", error);
    res.json({ user: null });
  }
}
