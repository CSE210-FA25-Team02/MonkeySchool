import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { BadRequestError } from "../utils/api-error.js";
import { env } from "../config/env.js";

export const initiateGoogleAuth = asyncHandler(async (req, res) => {
  const authUrl = authService.getGoogleAuthUrl();
  res.redirect(authUrl);
});

export const handleGoogleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    throw new BadRequestError("Missing authorization code");
  }

  const { user, token } = await authService.handleGoogleCallback(code);

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    res.send(`
      <div class="auth-success">
        <h2>Authentication Successful</h2>
        <p>Welcome, ${user.name}!</p>
        <p>Email: ${user.email}</p>
        <script>
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        </script>
      </div>
    `);
  } else {
    res.json({
      success: true,
      message: "Authentication successful",
      user,
      token,
    });
  }
});

export const verifyGoogleToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new BadRequestError("Missing ID token");
  }

  const { user, token: jwtToken } = await authService.verifyGoogleToken(token);

  res.cookie("token", jwtToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Token verified successfully",
    user,
    token: jwtToken,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    res.send(`
      <div class="user-profile">
        <h2>Profile</h2>
        <p>Name: ${user.name}</p>
        <p>Email: ${user.email}</p>
        ${user.photoUrl ? `<img src="${user.photoUrl}" alt="${user.name}" style="width: 100px; border-radius: 50%;">` : ''}
      </div>
    `);
  } else {
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
      },
    });
  }
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");

  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    res.send(`
      <div class="logout-success">
        <h2>Logged Out</h2>
        <p>You have been successfully logged out.</p>
        <script>
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        </script>
      </div>
    `);
  } else {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
});

