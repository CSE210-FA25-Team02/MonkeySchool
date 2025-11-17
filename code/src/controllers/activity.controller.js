import * as activityService from "../services/activity.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { createPunchCard,createActivityModal } from "../utils/htmx-templates/activity-templates.js";
import {
  createBaseLayout,
  createErrorMessage,
  createSuccessMessage,
} from "../utils/html-templates.js";

/**
 * Create Activity Punch
 */
export const createActivity = asyncHandler(async (req, res) => {
    let activity;
    const userId = req.user.id;

    try {
        const activityData = {
            ...req.body,
            userId,
            startTime: new Date(req.body.startTime),
            endTime: req.body.endTime ? new Date(req.body.endTime) : null
        };
        console.log("Activity Data", activityData);
        activity = await activityService.createActivity(activityData);
    } catch(err){
        console.log("Failed to create activity");
        return res.status(500).send("Failed to create activity. Try again.");
    }

    if (!activity) throw new NotFoundError("Activity");
    res.json(activity);
});

/**
 * Update Activity Punch (like time or the activity category)
 */

export const updateActivity = asyncHandler(async (req, res) => {
    const id = req.params.id;

    let updatedActivity;
    try {
        updatedActivity = await activityService.updateActivity(id, req.body);
    } catch(err) {
        console.log("Failed to update activity");
        return res.status(500).send("Failed to update activity. Try again.");
    }

    if (!updatedActivity) throw new NotFoundError("Activity");
    res.json(updatedActivity);
});

/**
 * Get Activity Punch
 */

export const getActivity = asyncHandler(async (req, res) => {
    const id = req.params.id;
    let activity;
    try {
        activity = await activityService.getActivityById(id);
    } catch(err) {
        console.log("Failed to get activity");
        return res.status(500).send("Failed to get activity. Try again.");
    }
    if (!activity) throw new NotFoundError("Activity");
    res.json(activity);
});

/**
 * Get Activity Punches from UserId
 */
export const getActivitiesByUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    let activities;
    try {
        activities = await activityService.getActivitiesByUserId(userId);
    } catch (err) {
        console.log("Failed to get activities for user");
        return res.status(500).send("Failed to get activities for this user.");
    }

    res.json(activities);
});

/**
 * Delete Activity Punch
*/
export const deleteActivity = asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
        await activityService.deleteActivity(id);
    } catch(err) {
        console.log("Failed to remove activity");
        return res.status(500).send("Failed to remove activity. Try again.");
    }

    res.status(204).send();
});


/**
 * HTMX Functions
 */

export const getActivityDropdown = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const activities = await activityService.getActivitiesByUserId(userId);

    let html = activities.map(a => `
        <option value="${a.id}">
            ${new Date(a.startTime).toLocaleDateString()} - ${a.category.name}
        </option>
    `).join("");

    res.send(html);
});

export const getActivityDetails = asyncHandler(async (req, res) => {
    const id = req.query.punchSelect; 

    const activity = await activityService.getActivityById(id);
    if (!activity) return res.send("<div>No activity found.</div>");

    const start = new Date(activity.startTime);
    const end = activity.endTime ? new Date(activity.endTime) : null;

    return res.send(`
        <div class="punchcard__section">
            <strong class="punchcard__label">Category</strong>
            <div class="punchcard__value">${activity.category.name}</div>
        </div>

        <div class="punchcard__section">
            <strong class="punchcard__label">Punch In Time</strong>
            <div class="punchcard__value">${start.toLocaleDateString()} - ${start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</div>
        </div>

        <div class="punchcard__section punchcard__section--last">
            <strong class="punchcard__label">Punch Out Time</strong>
            <div class="punchcard__value">
                ${end ? end.toLocaleDateString() + " - " + end.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : "—"}
            </div>
        </div>
    `);
});

export const renderActivityModal = asyncHandler(async (req, res) => {
    //Get current activity categories
    const categories = await activityService.getAllCategories();
    res.status(201).send(createActivityModal(categories));
});

export const renderPunchCard = asyncHandler(async (req, res)  => {
    const userId = req.user.id;
    console.log("UserID:", userId);
    res.status(201).send(createPunchCard());
});