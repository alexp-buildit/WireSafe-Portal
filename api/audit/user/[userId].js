const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');

module.exports = async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { userId } = req.query;

    if (req.method === 'GET') {
      return await getUserAuditLog(req, res, userId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function getUserAuditLog(req, res, targetUserId) {
  try {
    const requestingUserId = req.user.id;
    const userRoles = req.user.roles || [];

    if (requestingUserId !== targetUserId &&
        !userRoles.includes('main_escrow') &&
        !userRoles.includes('secondary_escrow')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You can only view your own audit logs, or if you are an escrow officer'
      });
    }

    const targetUserResult = await query(`
      SELECT id, username, first_name, last_name, roles
      FROM users
      WHERE id = $1
    `, [targetUserId]);

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    const targetUser = targetUserResult.rows[0];

    const { page = 1, limit = 50, action_filter, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;

    let auditQuery = `
      SELECT
        al.id,
        al.transaction_id,
        al.action,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        t.transaction_id as transaction_display_id,
        t.property_address
      FROM audit_logs al
      LEFT JOIN transactions t ON al.transaction_id = t.id
      WHERE al.user_id = $1
    `;

    let queryParams = [targetUserId];
    let paramCount = 1;

    if (action_filter) {
      paramCount++;
      auditQuery += ` AND al.action ILIKE $${paramCount}`;
      queryParams.push(`%${action_filter}%`);
    }

    if (date_from) {
      paramCount++;
      auditQuery += ` AND al.created_at >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      auditQuery += ` AND al.created_at <= $${paramCount}`;
      queryParams.push(date_to);
    }

    if (requestingUserId !== targetUserId) {
      const sharedTransactionsResult = await query(`
        SELECT DISTINCT t.id
        FROM transactions t
        WHERE (t.main_escrow_id = $1 OR t.secondary_escrow_id = $1)
          AND EXISTS (
            SELECT 1 FROM audit_logs al2
            WHERE al2.transaction_id = t.id AND al2.user_id = $2
          )
      `, [requestingUserId, targetUserId]);

      if (sharedTransactionsResult.rows.length > 0) {
        const sharedTransactionIds = sharedTransactionsResult.rows.map(row => row.id);
        paramCount++;
        auditQuery += ` AND (al.transaction_id = ANY($${paramCount}) OR al.transaction_id IS NULL)`;
        queryParams.push(sharedTransactionIds);
      } else {
        auditQuery += ` AND al.transaction_id IS NULL`;
      }
    }

    auditQuery += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await query(auditQuery, queryParams);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      WHERE al.user_id = $1
    `;

    let countParams = [targetUserId];
    let countParamCount = 1;

    if (action_filter) {
      countParamCount++;
      countQuery += ` AND al.action ILIKE $${countParamCount}`;
      countParams.push(`%${action_filter}%`);
    }

    if (date_from) {
      countParamCount++;
      countQuery += ` AND al.created_at >= $${countParamCount}`;
      countParams.push(date_from);
    }

    if (date_to) {
      countParamCount++;
      countQuery += ` AND al.created_at <= $${countParamCount}`;
      countParams.push(date_to);
    }

    if (requestingUserId !== targetUserId) {
      const sharedTransactionsResult = await query(`
        SELECT DISTINCT t.id
        FROM transactions t
        WHERE (t.main_escrow_id = $1 OR t.secondary_escrow_id = $1)
          AND EXISTS (
            SELECT 1 FROM audit_logs al2
            WHERE al2.transaction_id = t.id AND al2.user_id = $2
          )
      `, [requestingUserId, targetUserId]);

      if (sharedTransactionsResult.rows.length > 0) {
        const sharedTransactionIds = sharedTransactionsResult.rows.map(row => row.id);
        countParamCount++;
        countQuery += ` AND (al.transaction_id = ANY($${countParamCount}) OR al.transaction_id IS NULL)`;
        countParams.push(sharedTransactionIds);
      } else {
        countQuery += ` AND al.transaction_id IS NULL`;
      }
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const auditLogs = result.rows.map(row => ({
      id: row.id,
      transactionId: row.transaction_id,
      transactionDisplayId: row.transaction_display_id,
      propertyAddress: row.property_address,
      action: row.action,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at
    }));

    await createAuditLog(
      null,
      requestingUserId,
      'USER_AUDIT_LOG_VIEWED',
      {
        targetUserId,
        targetUsername: targetUser.username,
        page: parseInt(page),
        limit: parseInt(limit),
        actionFilter: action_filter || null,
        dateFrom: date_from || null,
        dateTo: date_to || null,
        resultCount: auditLogs.length
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      user: {
        id: targetUser.id,
        username: targetUser.username,
        firstName: targetUser.first_name,
        lastName: targetUser.last_name,
        roles: targetUser.roles
      },
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
    console.error('Get user audit log error:', error);
    return res.status(500).json({
      error: 'Failed to fetch user audit log',
      message: 'An internal error occurred'
    });
  }
}