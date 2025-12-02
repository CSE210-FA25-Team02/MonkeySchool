// code/tests/utils/auth.js

import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";

export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    isProf: user.isProf,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
}
