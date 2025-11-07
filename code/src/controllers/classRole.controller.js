import * as classRoleService from "../services/classRole.service.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Add or update a user’s role inside a class
 */
export const assignRole = asyncHandler(async (req, res) => {
  const { userId, classId, role } = req.body;
  const result = await classRoleService.upsertClassRole({ userId, classId, role });
  res.json(result);
});

/**
 * Remove a user from a class
 */
export const removeRole = asyncHandler(async (req, res) => {
  const { userId, classId } = req.body;
  await classRoleService.removeFromClass({ userId, classId });
  res.status(204).send();
});

/**
 * Get roster for a class
 */
export const getRoster = asyncHandler(async (req, res) => {
  const roster = await classRoleService.getRoster(req.params.classId);
  res.json(roster);
});
