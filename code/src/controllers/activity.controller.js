import * as activityService from "../services/activity.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import {
  createPunchCard,
  createActivityModal,
  createEditActivityModal,
  enableActivityFields,
} from "../utils/htmx-templates/activity-templates.js";
import { getClassesByUserId } from "../services/class.service.js";
import { getClassRole } from "../services/classRole.service.js";

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
      endTime: req.body.endTime ? new Date(req.body.endTime) : null,
    };
    console.log("Activity Data", activityData);
    activity = await activityService.createActivity(activityData);
  } catch {
    console.log("Failed to create activity");
    return res.status(500).send("Failed to create activity. Try again.");
  }

  if (!activity) throw new NotFoundError("Activity");
  res.status(201).json(activity);
});

/**
 * Update Activity Punch (like time or the activity category)
 */

export const updateActivity = asyncHandler(async (req, res) => {
  const id = req.params.id;

  let updatedActivity;
  try {
    const activityData = {
      ...req.body,
      startTime: new Date(req.body.startTime),
      endTime: req.body.endTime ? new Date(req.body.endTime) : null,
    };
    updatedActivity = await activityService.updateActivity(id, activityData);
  } catch {
    console.log("Failed to update activity");
    return res.status(500).send("Failed to update activity. Try again.");
  }

  if (!updatedActivity) throw new NotFoundError("Activity");
  res.status(201).json(updatedActivity);
});

/**
 * Get Activity Punch
 */

export const getActivity = asyncHandler(async (req, res) => {
  const id = req.params.id;
  let activity;
  try {
    activity = await activityService.getActivityById(id);
  } catch {
    console.log("Failed to get activity");
    return res.status(500).send("Failed to get activity. Try again.");
  }
  if (!activity) throw new NotFoundError("Activity");
  res.status(200).json(activity);
});

/**
 * Get Activity Punches from UserId
 */
export const getActivitiesByUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let activities;
  try {
    activities = await activityService.getActivitiesByUserId(userId);
  } catch {
    console.log("Failed to get activities for user");
    return res.status(500).send("Failed to get activities for this user.");
  }

  res.status(200).json(activities);
});

/**
 * Delete Activity Punch
 */
export const deleteActivity = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    await activityService.deleteActivity(id);
  } catch {
    console.log("Failed to remove activity");
    return res.status(500).send("Failed to remove activity. Try again.");
  }

  res.status(204).send();
});

/**
 * HTMX Functions
 */

/**
 * Render activity punches that belong to users
 */

export const getActivityDropdown = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const activities = await activityService.getActivitiesByUserId(userId);

  let html = activities
    .map(
      (a) => `
        <option value="${a.id}">
            ${new Date(a.startTime).toLocaleDateString()} - ${a.class.name} - ${a.category.name}
        </option>
    `
    )
    .join("");

  res.status(201).send(html);
});

/**
 * Render the details of the activity punch
 */

export const getActivityDetails = asyncHandler(async (req, res) => {
  const id = req.query.punchSelect;

  const activity = await activityService.getActivityById(id);
  if (!activity) return res.send("<div>No activity found.</div>");

  const start = new Date(activity.startTime);
  const end = activity.endTime ? new Date(activity.endTime) : null;

  return res.status(201).send(`
        <div class="punchcard__section">
            <strong class="punchcard__label">Category</strong>
            <div class="punchcard__value">${activity.category.name}</div>
        </div>

        <div class="punchcard__section">
            <strong class="punchcard__label">Punch In Time</strong>
            <div class="punchcard__value">${start.toLocaleDateString()} - ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
        </div>

        <div class="punchcard__section punchcard__section--last">
            <strong class="punchcard__label">Punch Out Time</strong>
            <div class="punchcard__value">
                ${end ? end.toLocaleDateString() + " - " + end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
            </div>
        </div>
    `);
});

/**
 * Render the modal to make new activity punches
 */

export const renderActivityModal = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const classes = await getClassesByUserId(userId);

  res.status(201).send(createActivityModal(classes));
});

/**
 * Render the modal to edit activity punches
 */

export const renderEditModal = asyncHandler(async (req, res) => {
  //Get current activity categories
  const id = req.query.punchSelect;
  const userId = req.user.id;
  const classes = await getClassesByUserId(userId);
  const activity = await activityService.getActivityById(id);
  const userRole = await getClassRole(userId, activity.class.id);
  const categories = await activityService.getAllCategories(userRole.role);

  res.status(201).send(createEditActivityModal(categories, activity, classes));
});

/**
 * When creating a new activity punch or editing, enable fields
 */
export const loadActivityFields = asyncHandler(async (req, res) => {
  const classId = req.query.classId;

  if (!classId) {
    return res.send(
      "<div id='activity-fields'>Error: No class selected.</div>"
    );
  }

  const userId = req.user.id;
  const classRole = await getClassRole(userId, classId);
  const categories = await activityService.getAllCategories(classRole.role);

  return res.status(201).send(enableActivityFields(categories));
});

/**
 * Render Punch Card component on page
 */

export const renderPunchCard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log("UserID:", userId);
  res.status(201).send(createPunchCard());
});

/**
 * Close Activity Punch Form
 */
export const closeActivityPunchForm = asyncHandler(async (req, res) => {
  res.status(201).send("");
});
