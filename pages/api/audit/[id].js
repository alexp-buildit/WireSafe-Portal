const { query } = require('../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../utils/auth');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id: transactionId } = req.query;

    if (req.method === 'GET') {
      return await getAuditLog(req, res, transactionId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function getAuditLog(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('main_escrow') && !userRoles.includes('secondary_escrow')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only escrow officers can view audit logs'
      });
    }

    const accessCheck = await query(`
      SELECT t.id FROM transactions t
      WHERE t.id = $1 AND (t.main_escrow_id = $2 OR t.secondary_escrow_id = $2)
    `, [transactionId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Transaction does not exist or you do not have access'
      });
    }

    const { page = 1, limit = 50, action_filter } = req.query;
    const offset = (page - 1) * limit;

    let auditQuery = `
      SELECT
        al.id,
        al.action,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.username,
        u.first_name,
        u.last_name,
        u.roles
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.transaction_id = $1
    `;

    let queryParams = [transactionId];
    let paramCount = 1;

    if (action_filter) {
      paramCount++;
      auditQuery += ` AND al.action ILIKE $${paramCount}`;
      queryParams.push(`%${action_filter}%`);
    }

    auditQuery += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await query(auditQuery, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      WHERE al.transaction_id = $1
      ${action_filter ? 'AND al.action ILIKE $2' : ''}
    `;

    const countParams = action_filter ? [transactionId, `%${action_filter}%`] : [transactionId];
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const auditLogs = result.rows.map(row => ({
      id: row.id,
      action: row.action,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      user: row.username ? {
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name,
        roles: row.roles
      } : null
    }));

    await createAuditLog(
      transactionId,
      userId,
      'AUDIT_LOG_VIEWED',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        actionFilter: action_filter || null,
        resultCount: auditLogs.length
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: (page * limit) < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get audit log error:', error);
    return res.status(500).json({
      error: 'Failed to fetch audit log',
      message: 'An internal error occurred'
    });
  }
}