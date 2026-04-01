/**
 * RBAC middleware.
 * Usage: router.get('/route', authenticate, authorize('admin', 'pastor'), handler)
 * Roles (highest → lowest): admin > pastor > staff > member
 */
const ROLE_LEVELS = { admin: 4, pastor: 3, staff: 2, member: 1 };

// Require the user to have one of the specified roles (exact match)
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const role = req.user.role?.toLowerCase();
  if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Require the user to have AT LEAST the given role level
const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const userLevel = ROLE_LEVELS[req.user.role?.toLowerCase()] || 0;
  const minLevel = ROLE_LEVELS[minRole.toLowerCase()] || 0;

  if (userLevel < minLevel) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authorize, requireMinRole };
