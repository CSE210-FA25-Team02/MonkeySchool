import { Router } from "express";
import * as workJournalController from "../controllers/workJournal.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create a new work journal entry
router.post("/", asyncHandler(workJournalController.createWorkJournal));

// Get all work journals for the current user
router.get("/", asyncHandler(workJournalController.getMyWorkJournals));

// Get a specific work journal by ID
router.get("/:id", asyncHandler(workJournalController.getWorkJournal));

// Update a work journal entry
router.put("/:id", asyncHandler(workJournalController.updateWorkJournal));

// Delete a work journal entry
router.delete("/:id", asyncHandler(workJournalController.deleteWorkJournal));

export default router;
