// Class Controller - JSON API Edition

import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError } from "../utils/api-error.js";
import { getUpcomingQuarters } from "../utils/html-templates.js";
import { createClassForm, displayInvite, createClassPage, createBaseLayout } from "../utils/html-templates.js";

/**
 * Create a new class
 */
export const createClass = asyncHandler(async (req, res) => {
  const klass = await classService.createClass(req.body);

  // Check if request is HTMX
  const isHTMX = req.headers['hx-request'];

  const inviteUrl = `${req.protocol}://${req.get('host')}/invite/${klass.inviteCode}`;

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
  res.status(204).send("");
});

/**
 * Render Classes Page
 */

export const renderClassPage = asyncHandler(async (req, res) =>  {
  res.status(201).send(createBaseLayout(`Your Classes`, createClassPage(req.user)));
});