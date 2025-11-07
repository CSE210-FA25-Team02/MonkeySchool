import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// CRUD
router.post("/", asyncHandler(userController.createUser));
router.get("/:id", asyncHandler(userController.getUser));
router.put("/:id", asyncHandler(userController.updateUser));
router.delete("/:id", asyncHandler(userController.deleteUser));

export default router;
