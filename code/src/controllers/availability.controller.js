/**
 * Availability Controller
 * code/src/controllers/availability.controller.js
 *
 * Weekly availability planner with backend integration.
 */

import { asyncHandler } from "../utils/async-handler.js";
import { createBaseLayout } from "../utils/html-templates.js";
import { renderAvailabilityPage } from "../utils/htmx-templates/availability-templates.js";
import { 
  getUserAvailability, 
  setUserWeeklyAvailability
} from "../services/availability.service.js";

/**
 * Render Availability Planning Page
 * Route: GET /availability
 * Auth: requireAuth
 */
export const getAvailabilityPage = asyncHandler(async (req, res) => {
  const user = req.user;
  const isHtmx = !!req.headers["hx-request"];

  // Load user's existing availability
  const userAvailability = await getUserAvailability(user.id);

  const html = renderAvailabilityPage(user, userAvailability);

  if (isHtmx) {
    res.send(html);
  } else {
    const fullPage = createBaseLayout("Availability", html, { user });
    res.send(fullPage);
  }
});

/**
 * Save User's Weekly Availability
 * Route: POST /availability/save
 * Auth: requireAuth
 */
export const saveUserAvailability = asyncHandler(async (req, res) => {
  const user = req.user;
  const { availability } = req.body;

  try {
    console.log('=== SAVE AVAILABILITY DEBUG ===');
    console.log('Raw availability data:', availability);
    console.log('User ID:', user.id);
    
    // Parse availability data from frontend
    const availabilityRanges = JSON.parse(availability);
    console.log('Parsed availability ranges:', JSON.stringify(availabilityRanges, null, 2));
    
    // Validate that it's an array
    if (!Array.isArray(availabilityRanges)) {
      return res.status(400).json({
        error: "Invalid availability data format"
      });
    }

    console.log('About to save to database...');
    // Save to database
    await setUserWeeklyAvailability(user.id, availabilityRanges);
    console.log('Successfully saved to database!');

    const isHtmx = !!req.headers["hx-request"];
    if (isHtmx) {
      res.status(200).send(""); // HTMX expects empty response on success
    } else {
      res.status(200).json({ 
        success: true, 
        message: "Availability saved successfully" 
      });
    }

  } catch (error) {
    console.error("Error saving availability:", error);
    
    const isHtmx = !!req.headers["hx-request"];
    if (isHtmx) {
      res.status(500).send(`
        <div class="alert alert--error">
          <p>Failed to save availability: ${error.message}</p>
        </div>
      `);
    } else {
      res.status(500).json({
        error: "Failed to save availability",
        details: error.message
      });
    }
  }
});
