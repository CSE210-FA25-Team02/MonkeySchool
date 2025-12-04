/**
 * ============================================================================
 * Pulse Controller
 * ============================================================================
 *
 * File: code/src/controllers/pulse.controller.js
 *
 * This controller handles pulse check-related routes:
 * - Submit pulse (POST /classes/:classId/pulse)
 * - Get today's pulse (GET /classes/:classId/pulse/today)
 *
 * ============================================================================
 */

import * as pulseService from "../services/pulse.service.js";
import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { BadRequestError, NotFoundError } from "../utils/api-error.js";
import { renderPulseSuccess } from "../utils/htmx-templates/classes-templates.js";
import { renderPulseAnalyticsPage } from "../utils/htmx-templates/pulse-templates.js";

/**
 * Submit or update a pulse entry for today
 *
 * Route: POST /classes/:id/pulse
 * Auth: requireAuth
 * Role: STUDENT only
 *
 * Body: { pulse: <1-5> }
 */
export const submitPulse = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const { pulse } = req.body;

  // Validate pulse is provided
  if (pulse === undefined || pulse === null) {
    throw new BadRequestError("Pulse value is required");
  }

  // Submit pulse (service handles validation and role checking)
  const pulseEntry = await pulseService.submitPulse(userId, classId, pulse);

  // Check if this is an HTMX request
  const isHtmxRequest = req.headers["hx-request"];

  if (isHtmxRequest) {
    // Return HTML for HTMX to swap into the container
    // Use outerHTML swap so the entire container is replaced with matching structure
    const successHtml = renderPulseSuccess(pulseEntry.value, classId);
    res.status(200).send(successHtml);
  } else {
    // Return JSON for API calls
    res.status(200).json({
      success: true,
      pulse: pulseEntry.value,
      message: "Pulse saved",
    });
  }
});

/**
 * Get today's pulse entry for the current user
 *
 * Route: GET /classes/:id/pulse/today
 * Auth: requireAuth
 * Role: STUDENT only
 */
export const getTodayPulse = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;

  // Get today's pulse (service handles role checking)
  const pulseEntry = await pulseService.getTodayPulse(userId, classId);

  // Return pulse value or null
  res.status(200).json({
    pulse: pulseEntry ? pulseEntry.value : null,
  });
});

/**
 * Get today's pulse entry (alternative endpoint for HTMX/UI)
 * This is the same as getTodayPulse but can be used by the UI directly
 *
 * Route: GET /classes/:id/pulse
 * Auth: requireAuth
 * Role: STUDENT only (for JSON) or INSTRUCTOR (for analytics page)
 */
export const getPulse = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;

  // Check if this is a request for analytics page (instructor view)
  // We'll check by attempting to verify instructor status first
  try {
    await pulseService.ensureUserIsInstructor(userId, classId);
    // If we get here, user is an instructor - redirect to analytics page
    // This will be handled by a separate route handler for clarity
    // For now, return student endpoint behavior
    // The analytics page route will be separate: /classes/:id/pulse/analytics/page
  } catch (error) {
    // User is not an instructor, treat as student request
    const pulseEntry = await pulseService.getTodayPulse(userId, classId);
    res.status(200).json({
      pulse: pulseEntry ? pulseEntry.value : null,
    });
    return;
  }

  // Fallback - should not reach here in normal flow
  res.status(200).json({
    pulse: null,
  });
});

/**
 * Get pulse analytics data (aggregated by day)
 *
 * Route: GET /classes/:id/pulse/analytics?range=7
 * Auth: requireAuth
 * Role: INSTRUCTOR only (professor, TA, tutor)
 *
 * Query params:
 * - range: Number of days (1, 7, or 30)
 */
export const getPulseAnalytics = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const range = parseInt(req.query.range || "7", 10);

  // Check permissions
  await pulseService.ensureUserIsInstructor(userId, classId);

  // Get analytics data
  const days = await pulseService.getPulseAnalytics(classId, range);

  res.status(200).json({
    range,
    days,
  });
});

/**
 * Get pulse details for a specific date (individual student entries)
 *
 * Route: GET /classes/:id/pulse/details?date=2025-12-02
 * Auth: requireAuth
 * Role: INSTRUCTOR only
 *
 * Query params:
 * - date: Date string in YYYY-MM-DD format
 */
export const getPulseDetails = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;
  const { date } = req.query;

  if (!date) {
    throw new BadRequestError("Date parameter is required (format: YYYY-MM-DD)");
  }

  // Check permissions
  await pulseService.ensureUserIsInstructor(userId, classId);

  // Get details
  const details = await pulseService.getPulseDetails(classId, date);

  res.status(200).json({
    date,
    entries: details,
  });
});

/**
 * Render pulse analytics page (instructor view)
 *
 * Route: GET /classes/:id/pulse/page
 * Auth: requireAuth
 * Role: INSTRUCTOR only
 */
export const renderPulseAnalytics = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const userId = req.user.id;

  // Check permissions
  await pulseService.ensureUserIsInstructor(userId, classId);

  // Get class info
  const klass = await classService.getClassById(classId);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Get default range (7 days)
  const range = parseInt(req.query.range || "7", 10);
  const selectedDate = req.query.date || null;

  // Get analytics data
  const analyticsData = await pulseService.getPulseAnalytics(classId, range);

  // Get averages for summary cards
  const avg1Day = await pulseService.getAveragePulse(classId, 1);
  const avg7Days = await pulseService.getAveragePulse(classId, 7);
  const avg30Days = await pulseService.getAveragePulse(classId, 30);

  // Get details if date is selected
  let detailsData = [];
  if (selectedDate) {
    try {
      const details = await pulseService.getPulseDetails(classId, selectedDate);
      detailsData = details;
    } catch (error) {
      // Invalid date or no data - ignore
      detailsData = [];
    }
  }

  const classInfo = {
    id: klass.id,
    name: klass.name,
  };

  // Render analytics page
  const content = renderPulseAnalyticsPage({
    classInfo,
    range,
    analyticsData,
    summaryAverages: {
      day1: avg1Day,
      day7: avg7Days,
      day30: avg30Days,
    },
    selectedDate,
    detailsData,
  });

  res.send(content);
});

