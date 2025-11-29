/**
 * Availability Controller
 * code/src/controllers/availability.controller.js
 *
 * Frontend-only weekly availability planner (dummy data).
 */

import { asyncHandler } from "../utils/async-handler.js";
import { createBaseLayout } from "../utils/html-templates.js";
import { renderAvailabilityPage } from "../utils/htmx-templates/availability-templates.js";

/**
 * Render Availability Planning Page
 * Route: GET /availability
 * Auth: requireAuth
 */
export const getAvailabilityPage = asyncHandler(async (req, res) => {
  const user = req.user;
  const isHtmx = !!req.headers["hx-request"];

  const html = renderAvailabilityPage(user);

  if (isHtmx) {
    res.send(html);
  } else {
    const fullPage = createBaseLayout("Availability", html, { user });
    res.send(fullPage);
  }
});
