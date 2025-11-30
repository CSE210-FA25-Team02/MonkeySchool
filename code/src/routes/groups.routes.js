import { Router } from "express";
import * as groupsController from "../controllers/groups.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

// =============================
// Groups Dashboard Routes
// =============================

/**
 * GET /groups/dashboard
 * Main groups dashboard page (HTMX compatible)
 * Shows personal availability and team calendars
 */
router.get(
  "/dashboard",
  requireAuth,
  asyncHandler(groupsController.renderGroupsDashboard)
);

/**
 * GET /groups (redirect to dashboard)
 * Default groups route redirects to dashboard
 */
router.get("/", (req, res) => {
  res.redirect("/groups/dashboard");
});

// =============================
// Personal Availability Routes
// =============================

/**
 * POST /groups/availability
 * Update user's personal availability (HTMX API)
 * Expects JSON body with availability array
 */
router.post(
  "/availability",
  requireAuth,
  asyncHandler(groupsController.updateUserAvailability)
);

// =============================
// Teams Data Routes
// =============================

/**
 * GET /groups/teams/data
 * Get all teams data for current user (JSON API)
 * Returns teams, availability, and events data
 */
router.get(
  "/teams/data",
  requireAuth,
  asyncHandler(groupsController.getTeamsData)
);

/**
 * GET /groups/team/:teamId/availability
 * Get specific team availability data (HTMX API)
 * Returns updated team availability HTML fragment
 */
router.get(
  "/team/:teamId/availability",
  requireAuth,
  asyncHandler(groupsController.getTeamAvailability)
);

// =============================
// Team Management Routes (Placeholder)
// =============================

/**
 * GET /groups/team/:teamId
 * View detailed team information
 * TODO: Implement team details controller
 */
router.get("/team/:teamId", requireAuth, (req, res) => {
  res.status(501).send(`
    <div class="not-implemented">
      <div class="not-implemented__content">
        <div class="not-implemented__icon">🚧</div>
        <h2 class="not-implemented__title">Team Details</h2>
        <p class="not-implemented__message">
          Team details page is under development.<br>
          This will show comprehensive team information, member profiles, and project details.
        </p>
        <div class="not-implemented__actions">
          <a href="/groups/dashboard" class="btn btn--primary">
            <i class="fas fa-arrow-left"></i>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  `);
});

/**
 * GET /groups/team/:teamId/chat
 * View team chat interface
 * TODO: Implement team chat controller
 */
router.get("/team/:teamId/chat", requireAuth, (req, res) => {
  res.status(501).send(`
    <div class="not-implemented">
      <div class="not-implemented__content">
        <div class="not-implemented__icon">💬</div>
        <h2 class="not-implemented__title">Team Chat</h2>
        <p class="not-implemented__message">
          Team chat functionality is under development.<br>
          This will provide real-time communication for team members.
        </p>
        <div class="not-implemented__actions">
          <a href="/groups/dashboard" class="btn btn--primary">
            <i class="fas fa-arrow-left"></i>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  `);
});

/**
 * GET /groups/team/:teamId/events/new
 * Create new team event form
 * TODO: Implement event creation controller
 */
router.get("/team/:teamId/events/new", requireAuth, (req, res) => {
  res.status(501).send(`
    <div class="not-implemented">
      <div class="not-implemented__content">
        <div class="not-implemented__icon">📅</div>
        <h2 class="not-implemented__title">Create Event</h2>
        <p class="not-implemented__message">
          Event creation functionality is under development.<br>
          This will allow team leaders to schedule meetings and events.
        </p>
        <div class="not-implemented__actions">
          <a href="/groups/dashboard" class="btn btn--primary">
            <i class="fas fa-arrow-left"></i>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  `);
});

/**
 * POST /groups/team/:teamId/events
 * Create new team event
 * TODO: Implement event creation API
 */
router.post("/team/:teamId/events", requireAuth, (req, res) => {
  res.status(501).json({
    error: "Event creation API is not yet implemented",
    message: "This endpoint will handle event creation for teams"
  });
});


export default router;