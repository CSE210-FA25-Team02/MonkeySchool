import { Router } from "express";
import * as journalController from "../controllers/journal.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

router.get("/", asyncHandler(journalController.renderJournalPage));
router.post("/", asyncHandler(journalController.createEntry));
router.get("/new", asyncHandler(journalController.renderEditPage)); // Order matters!
router.get("/:id", asyncHandler(journalController.renderEntryPage));
router.get("/:id/edit", asyncHandler(journalController.renderEditPage));
router.put("/:id", asyncHandler(journalController.updateEntry));
router.delete("/:id", asyncHandler(journalController.deleteEntry));

export default router;