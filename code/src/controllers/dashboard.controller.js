/**
 * ============================================================================
 * Dashboard Controller
 * ============================================================================
 * 
 * File: code/src/controllers/dashboard.controller.js
 * 
 * This controller renders the main dashboard page (/).
 * 
 * BACKEND DATA FLOW:
 * - Frontend templates are in: utils/htmx-templates/dashboard-templates.js
 * - Real data comes from: services/class.service.js, services/event.service.js
 * 
 * ============================================================================
 */

import * as classService from "../services/class.service.js";
import {
    asyncHandler
} from "../utils/async-handler.js";
import {
    createDashboard
} from "../utils/htmx-templates/dashboard-templates.js";
import {
    createBaseLayout
} from "../utils/html-templates.js";

/**
 * Get Dashboard Page
 * 
 * Route: GET /
 * Auth: requireAuth
 * 
 * BACKEND INTEGRATION:
 * - User info comes from auth middleware (req.user)
 * - Classes: classService.getClassesByUserId(userId)
 * - Events: eventService.getUpcomingEvents(userId) [TODO: implement]
 */
export const getDashboard = asyncHandler(async (req, res) => {
    // User is guaranteed by requireAuth middleware
    const user = req.user;
    const userId = user.id;

    // Fetch user's classes
    const classes = await classService.getClassesByUserId(userId);

    // Get first 3 classes for "Recent Classes" section
    const recentClasses = classes.slice(0, 3);

    // TODO: Backend team - implement eventService.getUpcomingEvents(userId)
    // For now, show empty events
    const upcomingEvents = [];

    // Render dashboard
    const dashboardHtml = createDashboard(user, recentClasses, upcomingEvents);

    // Check if HTMX request (partial) or full page request
    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
        res.send(dashboardHtml);
    } else {
        const fullHtml = createBaseLayout("Dashboard", dashboardHtml, { user });
        res.send(fullHtml);
    }
});