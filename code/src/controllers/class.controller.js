// Class Controller - JSON API Edition

import * as classService from "../services/class.service.js";
import * as classRoleService from "../services/classRole.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { getUpcomingQuarters } from "../utils/html-templates.js";
import { createClassForm, displayInvite, createClassPage, createBaseLayout } from "../utils/html-templates.js";

/**
 * Create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const { name, quarter } = req.body;
  
  // User Authentication
  const userId = req.user?.id || 1;
  if (!userId) {
    return res.status(400).send("No user found. Authentication not implemented.");
  }

  const isProf = req.user?.isProf || true;
  if (!isProf) {
    return res.status(401).send("Unauthorized to create class.");
  }
  
  // Validate input
  if (!name || name.trim().length === 0) {
    return res.status(400).send("Class name is required.");
  }

  // Create class
  let klass;
  try {
    klass = await classService.createClass({ name, quarter });
  } catch (err) {
    console.error("Error creating class:", err);
    return res.status(500).send("Failed to create class. Try again.");
  }

  // Get Class by invite code
  const classId = klass.id;

  // Add Professor who made call to class
  if (userId && userId !== 1) {
    try {
      await classRoleService.upsertClassRole({userId, classId, role: "PROFESSOR"});
    } catch (err) {
      return res.status(500).send("Unable to assign professor to class.");
    }
  }

  // Create invite URL
  const inviteUrl = `${req.protocol}://${req.get('host')}/invite/${klass.inviteCode}`;

  // Check if request is HTMX
  const isHTMX = req.headers['hx-request'];

  if (isHTMX) {
    res.status(201).send(displayInvite(inviteUrl));
  } else {
    res.status(201).json(klass);
  }
});

/**
 * Get class by ID (includes roster + groups)
 */
export const getClass = asyncHandler(async (req, res) => {
  const klass = await classService.getClassById(req.params.id);
  if (!klass) throw new NotFoundError("Class not found");
  res.json(klass);
});

/**
 * Get class by invite code (public join flow)
 */
export const getClassByInviteCode = asyncHandler(async (req, res) => {
  const klass = await classService.getClassByInviteCode(req.params.code);
  if (!klass) throw new NotFoundError("Class not found");

  // User Authentication
  const userId = req?.user?.id || 0;
  if (!userId) {
    return res.status(400).send("No user found. Authentication not implemented.");
  }

  const classId = klass.id;

  // Add Student (assumed)
  if (userId && userId !== 0) {
    try {
      await classRoleService.upsertClassRole({userId, classId, role: "STUDENT"});
    } catch (err) {
      return res.status(500).send("Unable to assign user to class.");
    }
  }


  res.json(klass);
});

/**
 * Update class name, quarter, etc.
 */
export const updateClass = asyncHandler(async (req, res) => {
  const klass = await classService.updateClass(req.params.id, req.body);
  res.json(klass);
});

/**
 * Delete a class by ID
 */
export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.status(204).send();
});


/**
 * Open/Close Class Create Form
 */
export const renderCreateClassForm = asyncHandler(async (req, res)  => {
  const upcomingQuarters = getUpcomingQuarters();
  res.status(201).send(createClassForm(upcomingQuarters));
});

export const closeCreateClassForm = asyncHandler(async (req, res)  => {
  res.status(201).send("");
});

/**
 * Render Classes Page
 */
export const renderClassPage = asyncHandler(async (req, res) =>  {
  res.status(201).send(createBaseLayout(`Your Classes`, createClassPage(req.user)));
});