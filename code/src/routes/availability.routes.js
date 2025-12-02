import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { 
  getAvailabilityPage, 
  saveUserAvailability 
} from "../controllers/availability.controller.js";

const router = Router();

// Weekly availability planning page
router.get("/", requireAuth, asyncHandler(getAvailabilityPage));

// Save user's weekly availability
router.post("/save", requireAuth, asyncHandler(saveUserAvailability));

export default router;
