import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getAvailabilityPage } from "../controllers/availability.controller.js";

const router = Router();

// Weekly availability planning page
router.get("/", requireAuth, asyncHandler(getAvailabilityPage));

export default router;


