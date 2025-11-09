import { asyncHandler } from "../utils/async-handler.js";
import { UnauthorizedError } from "../utils/api-error.js";
import { verifyJWT } from "../services/auth.service.js";
import * as userService from "../services/user.service.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new UnauthorizedError("Authentication required");
  }

  const decoded = verifyJWT(token);
  const user = await userService.getUserById(decoded.id);

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  req.user = user;
  req.userId = user.id;

  next();
});

