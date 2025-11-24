import * as journalService from "../services/journal.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError, ForbiddenError } from "../utils/api-error.js";
import { createBaseLayout } from "../utils/html-templates.js";
import {
  createJournalPage,
  createJournalEntryView,
  createJournalEntryForm,
  createJournalList,
} from "../utils/components/journal-page.js";

/**
 * Render the main journal page with list
 */
export const renderJournalPage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const entries = await journalService.getEntriesByUser(userId);
  const content = createJournalPage(entries);

  if (req.headers["hx-request"]) {
    res.send(content);
  } else {
    res.send(createBaseLayout("My Journal", content));
  }
});

/**
 * Render a single journal entry
 */
export const renderEntryPage = asyncHandler(async (req, res) => {
  const entry = await journalService.getEntryById(req.params.id);
  if (!entry) throw new NotFoundError("Entry not found");
  if (entry.userId !== req.user.id) throw new ForbiddenError("Access denied");

  res.send(createJournalEntryView(entry));
});

/**
 * Render the create/edit form
 */
export const renderEditPage = asyncHandler(async (req, res) => {
  if (req.params.id) {
    // Edit mode
    const entry = await journalService.getEntryById(req.params.id);
    if (!entry) throw new NotFoundError("Entry not found");
    if (entry.userId !== req.user.id) throw new ForbiddenError("Access denied");
    res.send(createJournalEntryForm(entry));
  } else {
    // Create mode
    res.send(createJournalEntryForm());
  }
});

/**
 * Create a new entry
 */
export const createEntry = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const entry = await journalService.createEntry(userId, req.body);

  // Return the view for the new entry, and update the list via OOB swap if possible,
  // or just redirect the whole page if not using OOB.
  // For simplicity with HTMX, we can return the entry view and trigger a client event to refresh the list,
  // or return a response that updates both targets.
  // Since we are targeting #journal-content, we return the view.
  // To update the sidebar list, we can use HX-Trigger-After-Swap or return OOB content.

  const entryHtml = createJournalEntryView(entry);
  const entries = await journalService.getEntriesByUser(userId);
  const listHtml = createJournalList(entries);

  // Using OOB swap to update the list
  res.send(`
    ${entryHtml}
    <div id="journal-list" hx-swap-oob="true">
      ${listHtml}
    </div>
  `);
});

/**
 * Update an entry
 */
export const updateEntry = asyncHandler(async (req, res) => {
  const existing = await journalService.getEntryById(req.params.id);
  if (!existing) throw new NotFoundError("Entry not found");
  if (existing.userId !== req.user.id) throw new ForbiddenError("Access denied");

  const entry = await journalService.updateEntry(req.params.id, req.body);

  const entryHtml = createJournalEntryView(entry);
  const entries = await journalService.getEntriesByUser(req.user.id);
  const listHtml = createJournalList(entries);

  res.send(`
    ${entryHtml}
    <div id="journal-list" hx-swap-oob="true">
      ${listHtml}
    </div>
  `);
});

/**
 * Delete an entry
 */
export const deleteEntry = asyncHandler(async (req, res) => {
  const existing = await journalService.getEntryById(req.params.id);
  if (!existing) throw new NotFoundError("Entry not found");
  if (existing.userId !== req.user.id) throw new ForbiddenError("Access denied");

  await journalService.deleteEntry(req.params.id);

  const entries = await journalService.getEntriesByUser(req.user.id);
  const listHtml = createJournalList(entries);

  // Clear content and update list
  res.send(`
    <div class="empty-state">
      <p>Entry deleted.</p>
    </div>
    <div id="journal-list" hx-swap-oob="true">
      ${listHtml}
    </div>
  `);
});