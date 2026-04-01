/**
 * RBAC middleware.
 *
 * Role hierarchy (highest → lowest): admin(4) > pastor(3) > staff(2) > member(1)
 *
 * Enforced rules:
 *  - Members  : can only access their own profile/giving (use requireSelf)
 *  - Pastors  : can see metrics and directories, but NOT financial totals
 *  - Staff    : Calendar, Visitors, Announcements only — no financial access
 *  - Admin    : full access including Donation Dashboard
 */

const ROLE_LEVELS = { admin: 4, pastor: 3, staff: 2, member: 1 };

// Exact role match — user must be one of the listed roles
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const role = req.user.role?.toLowerCase();
  if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Minimum role level — user must be AT LEAST the given role
const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const userLevel = ROLE_LEVELS[req.user.role?.toLowerCase()] || 0;
  const minLevel  = ROLE_LEVELS[minRole.toLowerCase()]        || 0;

  if (userLevel < minLevel) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

/**
 * requireSelf — ensures a member can only access their OWN resource.
 * Staff and above bypass this check and can access any user's resource.
 *
 * Usage: router.get('/:id/resource', authenticate, requireSelf('id'), handler)
 * The paramName is the route param holding the target user's ID (default: 'id').
 */
const requireSelf = (paramName = 'id') => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const userLevel = ROLE_LEVELS[req.user.role?.toLowerCase()] || 0;

  // Staff and above can access any user's resource
  if (userLevel >= ROLE_LEVELS['staff']) return next();

  // Members may only access their own resource
  if (req.params[paramName] === req.user.id) return next();

  return res.status(403).json({ error: 'You can only access your own data' });
};

/**
 * blockRole — explicitly blocks a role from an endpoint.
 * Usage: router.get('/financials', authenticate, blockRole('pastor','staff'), handler)
 */
const blockRole = (...blockedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const role = req.user.role?.toLowerCase();
  if (blockedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return res.status(403).json({ error: 'Access to financial data is restricted' });
  }
  next();
};

module.exports = { authorize, requireMinRole, requireSelf, blockRole };
