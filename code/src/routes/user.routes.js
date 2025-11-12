import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// CRUD
router.get("/:id/profile", asyncHandler(userController.renderUserProfilePage));
router.get(
  "/:id/profile/link-field",
  asyncHandler(userController.renderProfileLinkField),
);
router.post("/", asyncHandler(userController.createUser));
router.get("/:id", asyncHandler(userController.getUser));
router.put("/:id", asyncHandler(userController.updateUser));
router.delete("/:id", asyncHandler(userController.deleteUser));

export default router;
