import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as userService from "./user.service.js";
import { BadRequestError, UnauthorizedError, ForbiddenError } from "../utils/api-error.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new BadRequestError(
      error.error_description || "Failed to exchange authorization code"
    );
  }

  return response.json();
}

async function verifyGoogleIdToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
  } catch (error) {
    throw new UnauthorizedError("Invalid Google ID token, error is", error);
  }
}

async function isEmailAuthorized(email) {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  
  if (emailLower.endsWith("@ucsd.edu")) {
    return true;
  }

  const user = await userService.getUserByEmail(email);
  return user !== null;
}

async function findOrCreateUser(payload) {
  const { sub: googleId, email, name, picture } = payload;

  if (!email) {
    throw new BadRequestError("Email is required for authentication");
  }

  const emailLower = email.toLowerCase();
  const isUCSDEmail = emailLower.endsWith("@ucsd.edu");

  let user = await userService.getUserByGoogleId(googleId);

  if (user) {
    if (!isUCSDEmail && !(await isEmailAuthorized(email))) {
      throw new ForbiddenError(
        "Access denied. Your email is not authorized. Please contact an administrator."
      );
    }

    const updateData = {};
    if (name && user.name !== name) updateData.name = name;
    if (picture && user.photoUrl !== picture) updateData.photoUrl = picture;

    if (Object.keys(updateData).length > 0) {
      user = await userService.updateUser(user.id, updateData);
    }
    return user;
  }

  user = await userService.getUserByEmail(email);

  if (user) {
    if (!isUCSDEmail && !(await isEmailAuthorized(email))) {
      throw new ForbiddenError(
        "Access denied. Your email is not authorized. Please contact an administrator."
      );
    }

    user = await userService.updateUser(user.id, {
      googleId,
      photoUrl: picture || user.photoUrl,
    });
    return user;
  }

  if (!isUCSDEmail && !(await isEmailAuthorized(email))) {
    throw new ForbiddenError(
      "Access denied. Your email is not authorized. Please contact an administrator to be added to the system."
    );
  }

  return userService.createUser({
    email,
    name,
    googleId,
    photoUrl: picture,
  });
}

export async function handleGoogleCallback(code) {
  if (!code) {
    throw new BadRequestError("Missing authorization code");
  }

  const tokens = await exchangeCodeForTokens(code);

  if (!tokens.id_token) {
    throw new BadRequestError("No ID token received from Google");
  }

  const payload = await verifyGoogleIdToken(tokens.id_token);
  const user = await findOrCreateUser(payload);
  const token = generateJWT(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
    },
    token,
  };
}

export async function verifyGoogleToken(idToken) {
  if (!idToken) {
    throw new BadRequestError("Missing ID token");
  }

  const payload = await verifyGoogleIdToken(idToken);
  const user = await findOrCreateUser(payload);
  const token = generateJWT(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
    },
    token,
  };
}

export function generateJWT(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired token, error is", error);
  }
}

