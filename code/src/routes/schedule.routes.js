/**
 * Schedule Routes
 * code/src/routes/schedule.routes.js
 */

import { Router } from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import * as eventController from "../controllers/event.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Class schedule page
router.get(
  "/classes/:id/schedule",
  requireAuth,
  asyncHandler(scheduleController.renderClassSchedule),
);

// Create event
router.post(
  "/events/create",
  requireAuth,
  asyncHandler(eventController.createEvent),
);

// Get event by ID
router.get(
  "/events/:id",
  requireAuth,
  asyncHandler(eventController.getEvent),
);

// Get event edit form
router.get(
  "/events/:id/edit",
  requireAuth,
  asyncHandler(eventController.getEventEditForm),
);

// Update event
router.put(
  "/events/:id",
  requireAuth,
  asyncHandler(eventController.updateEvent),
);

// Delete event
router.delete(
  "/events/:id",
  requireAuth,
  asyncHandler(eventController.deleteEvent),
);

export default router;
