/**
 * Work Journal Controller
 * code/src/controllers/workJournal.controller.js
 */

import * as workJournalService from "../services/workJournal.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError, BadRequestError } from "../utils/api-error.js";
import { renderWorkJournalsList } from "../utils/htmx-templates/profile-templates.js";

/**
 * Create a new work journal entry
 * Auth: requireAuth
 */
export const createWorkJournal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { content, mood } = req.body;

  if (!content || content.trim() === "") {
    throw new BadRequestError("Content is required");
  }

  const journal = await workJournalService.createWorkJournal({
    userId,
    content: content.trim(),
    mood: mood || null,
  });

  const isHtmx = !!req.headers["hx-request"];
  const hxTarget = req.headers["hx-target"];

  if (isHtmx) {
    // HTMX sends hx-target without the # symbol, so normalize the comparison
    // If target is work-journals-list (or #work-journals-list), return the updated list (profile page)
    const normalizedTarget = hxTarget?.replace(/^#/, "") || "";
    if (normalizedTarget === "work-journals-list") {
      const journals = await workJournalService.getWorkJournalsByUserId(userId);
      const html = renderWorkJournalsList(journals);
      res.status(201).send(html);
    } else {
      // For dashboard or other targets, just return success (no content)
      res.status(201).send("");
    }
  } else {
    res.status(201).json(journal);
  }
});

/**
 * Get all work journals for the current user
 * Auth: requireAuth
 */
export const getMyWorkJournals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const journals = await workJournalService.getWorkJournalsByUserId(userId);

  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Return HTML for HTMX requests
    const html = renderWorkJournalsList(journals);
    res.send(html);
  } else {
    res.json(journals);
  }
});

/**
 * Get a specific work journal by ID
 * Auth: requireAuth
 */
export const getWorkJournal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const journal = await workJournalService.getWorkJournalById(id);

  if (!journal) {
    throw new NotFoundError("Work journal not found");
  }

  // Ensure user can only access their own journals
  if (journal.userId !== req.user.id) {
    throw new NotFoundError("Work journal not found");
  }

  res.json(journal);
});

/**
 * Update a work journal entry
 * Auth: requireAuth
 */
export const updateWorkJournal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { content, mood } = req.body;

  // Verify journal exists and belongs to user
  const existing = await workJournalService.getWorkJournalById(id);
  if (!existing) {
    throw new NotFoundError("Work journal not found");
  }
  if (existing.userId !== userId) {
    throw new NotFoundError("Work journal not found");
  }

  const updateData = {};
  if (content !== undefined) {
    if (content.trim() === "") {
      throw new BadRequestError("Content cannot be empty");
    }
    updateData.content = content.trim();
  }
  if (mood !== undefined) {
    updateData.mood = mood || null;
  }

  const updated = await workJournalService.updateWorkJournal(id, updateData);
  res.json(updated);
});

/**
 * Delete a work journal entry
 * Auth: requireAuth
 */
export const deleteWorkJournal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify journal exists and belongs to user
  const existing = await workJournalService.getWorkJournalById(id);
  if (!existing) {
    throw new NotFoundError("Work journal not found");
  }
  if (existing.userId !== userId) {
    throw new NotFoundError("Work journal not found");
  }

  await workJournalService.deleteWorkJournal(id);

  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Return updated work journals list as HTML
    const journals = await workJournalService.getWorkJournalsByUserId(userId);
    const html = renderWorkJournalsList(journals);
    res.send(html);
  } else {
    res.status(204).send();
  }
});
