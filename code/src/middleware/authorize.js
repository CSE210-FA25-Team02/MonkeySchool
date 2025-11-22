/**
 * Authorization Middleware
 *
 * Checks if a user has the required role for a given quarter and resource.
 */

/**
 * Middleware to require a specific role for a resource in a specific quarter.
 *
 * @param {string} resourceType - The type of resource to check (e.g., "class", "group").
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

      const roles = user[`${resourceType}Roles`];
      if (!roles) {
        return res.status(500).json({ error: "Invalid resource type" });
      }

      const role = roles.find(
        (r) =>
          r[`${resourceType}Id`] === resourceId &&
          r[resourceType].quarter === quarter,
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

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
