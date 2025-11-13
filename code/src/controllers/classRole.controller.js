import { asyncHandler } from "../utils/async-handler.js";


export const createClassRoleController = (classRoleService) => ({

  /**
   * GET /api/classRoles/:classId/roster
   * Fetch all user-role pairs for a class
   */
  getRoster: asyncHandler(async (req, res) => {
    const { classId } = req.params;

    const roster = await classRoleService.getRoster(classId);

    res.status(200).json({
      success: true,
      data: roster,
      meta: {
        classId,
        totalUsers: roster.length,
        lastUpdated: new Date().toISOString()
      }
    });
  }),

  /**
   * PUT /api/classRoles/:classId/roster/:userId/assign
   * Assign or update a role for a user in a class
   */
  updateUserRoleByClass: asyncHandler(async (req, res) => {
    const { classId, userId } = req.params;
    const { role } = req.body;
    const requesterId = req.user?.id || 'test-user-id'; // Mock for testing

    const updated = await classRoleService.updateUserRoleByClass(
      classId,
      userId,
      role,
      requesterId
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: `User role updated to ${role} successfully`
    });
  }),

  /**
   * DELETE /api/classRoles/:classId/roster/:userId/remove
   * Remove a user from a class
   */
  removeUserFromClass: asyncHandler(async (req, res) => {
    const { classId, userId } = req.params;
    const requesterId = req.user?.id || 'test-user-id'; // Mock for testing

    const result = await classRoleService.removeUserFromClass(
      classId,
      userId,
      requesterId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  }),

  // /**
  //  * POST /api/classRoles/:classId/roster/:userId/add
  //  * Add a new user to the class with specified role
  //  */
  // addUserToClass: asyncHandler(async (req, res) => {
  //   const { classId, userId } = req.params;
  //   const { role } = req.body;
  //   const requesterId = req.user.id; // from auth middleware

  //   const newMember = await classRoleService.addUserToClass(
  //     classId,
  //     userId,
  //     role,
  //     requesterId
  //   );

  //   res.status(201).json({
  //     success: true,
  //     data: newMember,
  //     message: `User added to class with role ${role} successfully`
  //   });
  // })

});



// /**
//  * Add or update a user’s role inside a class
//  */
// export const assignRole = asyncHandler(async (req, res) => {
//   const { userId, classId, role } = req.body;
//   const result = await classRoleService.upsertClassRole({ userId, classId, role });
//   res.json(result);
// });

// /**
//  * Remove a user from a class
//  */
// export const removeRole = asyncHandler(async (req, res) => {
//   const { userId, classId } = req.body;
//   await classRoleService.removeFromClass({ userId, classId });
//   res.status(204).send();
// });

// /**
//  * Get roster for a class
//  */
// export const getRoster = asyncHandler(async (req, res) => {
//   const roster = await classRoleService.getRoster(req.params.classId);
//   res.json(roster);
// });
