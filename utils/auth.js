const jwt = require('jsonwebtoken');
const { query } = require('../lib/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return req.cookies?.token;
}

async function getUserFromToken(token) {
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  try {
    const result = await query(
      'SELECT id, username, email, first_name, last_name, phone_number, company_name, roles, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) return null;

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function requireAuth(req, res, next) {
  try {
    const token = await getTokenFromRequest(req);
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

async function createAuditLog(transactionId, userId, action, details, ipAddress, userAgent) {
  try {
    await query(
      `INSERT INTO audit_logs (transaction_id, user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [transactionId, userId, action, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

module.exports = {
  generateToken,
  verifyToken,
  getUserFromToken,
  requireAuth,
  requireRole,
  createAuditLog,
  getClientIP
};