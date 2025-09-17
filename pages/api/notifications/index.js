const { query } = require('../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../utils/auth');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    if (req.method === 'GET') {
      return await getNotifications(req, res);
    } else if (req.method === 'PUT') {
      return await markNotificationsRead(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = 'false' } = req.query;
    const offset = (page - 1) * limit;

    let notificationsQuery = `
      SELECT
        n.id,
        n.transaction_id,
        n.type,
        n.title,
        n.message,
        n.read_at,
        n.created_at,
        t.transaction_id as transaction_display_id,
        t.property_address
      FROM notifications n
      LEFT JOIN transactions t ON n.transaction_id = t.id
      WHERE n.user_id = $1
    `;

    let queryParams = [userId];
    let paramCount = 1;

    if (unread_only === 'true') {
      notificationsQuery += ` AND n.read_at IS NULL`;
    }

    notificationsQuery += ` ORDER BY n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await query(notificationsQuery, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE n.user_id = $1
      ${unread_only === 'true' ? 'AND n.read_at IS NULL' : ''}
    `;

    const countResult = await query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);

    const unreadCountResult = await query(`
      SELECT COUNT(*) as unread_count
      FROM notifications n
      WHERE n.user_id = $1 AND n.read_at IS NULL
    `, [userId]);
    const unreadCount = parseInt(unreadCountResult.rows[0].unread_count);

    const notifications = result.rows.map(row => ({
      id: row.id,
      transactionId: row.transaction_id,
      transactionDisplayId: row.transaction_display_id,
      propertyAddress: row.property_address,
      type: row.type,
      title: row.title,
      message: row.message,
      readAt: row.read_at,
      createdAt: row.created_at,
      isUnread: !row.read_at
    }));

    await createAuditLog(
      null,
      userId,
      'NOTIFICATIONS_VIEWED',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unread_only === 'true',
        resultCount: notifications.length
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: (page * limit) < total,
        hasPrevPage: page > 1
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      error: 'Failed to fetch notifications',
      message: 'An internal error occurred'
    });
  }
}

async function markNotificationsRead(req, res) {
  try {
    const userId = req.user.id;
    const { notificationIds, markAllRead = false } = req.body;

    if (markAllRead) {
      await query(`
        UPDATE notifications
        SET read_at = NOW()
        WHERE user_id = $1 AND read_at IS NULL
      `, [userId]);

      await createAuditLog(
        null,
        userId,
        'ALL_NOTIFICATIONS_MARKED_READ',
        {},
        getClientIP(req),
        req.headers['user-agent']
      );

      return res.status(200).json({
        message: 'All notifications marked as read'
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid notification IDs',
        message: 'Notification IDs must be provided as an array'
      });
    }

    const result = await query(`
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = $1 AND id = ANY($2) AND read_at IS NULL
      RETURNING id
    `, [userId, notificationIds]);

    await createAuditLog(
      null,
      userId,
      'NOTIFICATIONS_MARKED_READ',
      {
        notificationIds,
        markedCount: result.rows.length
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      message: 'Notifications marked as read',
      markedCount: result.rows.length
    });

  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({
      error: 'Failed to mark notifications as read',
      message: 'An internal error occurred'
    });
  }
}