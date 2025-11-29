/**
 * Schedule Controller
 * code/src/controllers/schedule.controller.js
 *
 * Handles schedule/calendar page rendering for classes
 */

import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { createBaseLayout } from "../utils/html-templates.js";
import { renderSchedulePage } from "../utils/htmx-templates/schedule-templates.js";
import * as classService from "../services/class.service.js";

/**
 * Render class schedule page
 * Route: GET /classes/:id/schedule
 * Auth: requireAuth
 */
export const renderClassSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const view = req.query.view || "week";
  const dateParam = req.query.date;

  // Fetch class info
  const klass = await classService.getClassById(id);
  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Parse date or use today
  let currentDate = new Date();
  if (dateParam) {
    currentDate = new Date(dateParam);
    if (isNaN(currentDate.getTime())) {
      currentDate = new Date();
    }
  }

  // Render schedule page
  const content = renderSchedulePage(klass, view, currentDate);

  const isHtmx = req.headers["hx-request"];
  if (isHtmx) {
    res.send(content);
  } else {
    const fullPage = createBaseLayout(
      `${klass.name} - Schedule`,
      content,
      { user: req.user },
    );
    res.send(fullPage);
  }
});

