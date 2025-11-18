/**
 * Authorization Middleware
 *
 * Checks if a user has the required role for a given quarter and resource.
 */

/**
 * Middleware to require a specific role for a resource in a specific quarter.
 *
 * @param {string} resourceType - The type of resource to check (e.g. "class", "group").
 * @param {string[]} allowedRoles - An array of allowed role types.
 * @returns {Function} Express middleware function
 */
export function requireRole(resourceType, allowedRoles) {
  return async (req, res, next) => {
    try {
      const { quarter, id: resourceId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Handle group authorization
      if (resourceType === "group") {
        const groupId = resourceId;

        // Check if user is a TA supervising this group
        const isSupervisor = user.groupSupervises?.some(
          (gs) => gs.groupId === groupId
        );

        if (isSupervisor && allowedRoles.includes("TA")) {
          return next();
        }

        // Check if user is group leader
        const groupLeader = user.groupRoles?.find(
          (gr) => gr.groupId === groupId && gr.role === "LEADER"
        );

        if (groupLeader && allowedRoles.includes("LEADER")) {
          return next();
        }

        // Check if user is group member
        const groupMember = user.groupRoles?.find(
          (gr) => gr.groupId === groupId && gr.role === "MEMBER"
        );

        if (groupMember && allowedRoles.includes("MEMBER")) {
          return next();
        }

        // Allow TA or Professor; validation will happen in controller/service layer
        if (allowedRoles.includes("TA") || allowedRoles.includes("PROFESSOR")) {
          return next();
        }

        return res.status(403).json({
          error: `Forbidden: You do not have the required role for this ${resourceType}`,
        });
      }

      // Handle class authorization (your original logic)
      if (resourceType === "class") {
        const roles = user[`${resourceType}Roles`];

        if (!roles) {
          return res.status(500).json({ error: "Invalid resource type" });
        }

        const role = roles.find(
          (r) =>
            r[`${resourceType}Id`] === resourceId &&
            r[resourceType].quarter === quarter
        );

        if (!role) {
          return res.status(403).json({
            error: `Forbidden: You are not a member of this ${resourceType} for the specified quarter`,
          });
        }

        if (!allowedRoles.includes(role.role)) {
          return res
            .status(403)
            .json({ error: "Forbidden: You do not have the required role" });
        }

        return next();
      }

      // Unknown or unsupported resource type
      return res.status(500).json({ error: "Unsupported resource type" });
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
