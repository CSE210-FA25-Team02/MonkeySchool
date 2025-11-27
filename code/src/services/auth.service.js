/**
 * Authentication Service
 *
 * Handles email validation, user creation/retrieval, and JWT token management
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { getUserByEmail, createUser } from './user.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if email is allowed to login
 * First checks if it's a UCSD email, then checks CSV file
 * @param {string} email Email address to validate
 * @returns {Promise<boolean>} True if the email is allowed to authenticate
 */
export async function isEmailAllowed(email) {
  // Check if it's a UCSD email
  if (email.endsWith('@ucsd.edu')) {
    return true;
  }

  // Check CSV file for external emails
  const csvPath = path.join(__dirname, '../../data/external-emails.csv');

  return new Promise((resolve, reject) => {
    const allowedEmails = [];

    if (!fs.existsSync(csvPath)) {
      // If CSV doesn't exist, only UCSD emails are allowed
      resolve(false);
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.email && row.email.trim()) {
          allowedEmails.push(row.email.trim().toLowerCase());
        }
      })
      .on('end', () => {
        const emailLower = email.toLowerCase().trim();
        resolve(allowedEmails.includes(emailLower));
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

/**
 * Get or create user from OAuth profile
 * @param {Object} profile OAuth profile data (email, name, picture, etc.)
 * @returns {Promise<Object>} The existing or newly created user record
 * @throws {Error} If email is not permitted
 */
export async function getOrCreateUser(profile) {
  const { email, name, picture } = profile;

  // Check if email is allowed
  const isAllowed = await isEmailAllowed(email);
  if (!isAllowed) {
    throw new Error(
      'Email not authorized. Only UCSD emails or whitelisted external emails are allowed.'
    );
  }

  // Check if user exists
  let user = await getUserByEmail(email);

  if (!user) {
    // Create new user
    user = await createUser({
      email,
      name: name || email.split('@')[0],
      photoUrl: picture || null,
    });
  } else {
    // Update user photo if provided and different
    if (picture && user.photoUrl !== picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { photoUrl: picture },
      });
    }
  }

  return user;
}

/**
 * Generate JWT token for user
 * @param {Object} user User record
 * @returns {string} Signed JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
}

/**
 * Verify JWT token
 * @param {string} token JWT token to verify
 * @returns {Object|null} Decoded token payload, null otherwise
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
