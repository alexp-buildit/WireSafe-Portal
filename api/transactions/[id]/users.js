const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');
const { sanitizeObject } = require('../../../../utils/validation');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id } = req.query;

    if (req.method === 'PUT') {
      return await addUserToTransaction(req, res, id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function addUserToTransaction(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('main_escrow')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only main escrow officers can add users to transactions'
      });
    }

    const sanitizedData = sanitizeObject(req.body);
    const { username, role } = sanitizedData;

    if (!username || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and role are required'
      });
    }

    const validRoles = ['buyer', 'seller', 'lender'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: ' + validRoles.join(', ')
      });
    }

    const transactionCheck = await query(`
      SELECT t.id FROM transactions t
      WHERE t.id = $1 AND t.main_escrow_id = $2
    `, [transactionId, userId]);

    if (transactionCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Transaction does not exist or you do not have permission to modify it'
      });
    }

    const userResult = await query(
      'SELECT id, username, first_name, last_name, email, roles FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    const targetUser = userResult.rows[0];
    const targetUserRoles = targetUser.roles || [];

    if (!targetUserRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid user role',
        message: `User ${username} is not authorized for the role ${role}`
      });
    }

    const existingParticipant = await query(`
      SELECT id FROM transaction_participants
      WHERE transaction_id = $1 AND user_id = $2 AND role = $3
    `, [transactionId, targetUser.id, role]);

    if (existingParticipant.rows.length > 0) {
      return res.status(409).json({
        error: 'User already added',
        message: `User ${username} is already a ${role} in this transaction`
      });
    }

    const result = await query(`
      INSERT INTO transaction_participants (transaction_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, added_at
    `, [transactionId, targetUser.id, role]);

    const participant = result.rows[0];

    await query(`
      INSERT INTO notifications (user_id, transaction_id, type, title, message)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      targetUser.id,
      transactionId,
      'TRANSACTION_INVITATION',
      'Added to Transaction',
      `You have been added as a ${role} to a real estate transaction. Please log in to view details and complete required actions.`
    ]);

    await createAuditLog(
      transactionId,
      userId,
      'USER_ADDED_TO_TRANSACTION',
      {
        addedUsername: username,
        addedUserId: targetUser.id,
        role: role
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'User added to transaction successfully',
      participant: {
        id: participant.id,
        user: {
          id: targetUser.id,
          username: targetUser.username,
          firstName: targetUser.first_name,
          lastName: targetUser.last_name,
          email: targetUser.email
        },
        role: role,
        addedAt: participant.added_at
      }
    });

  } catch (error) {
    console.error('Add user to transaction error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'User already added',
        message: 'This user is already a participant in this transaction with this role'
      });
    }

    return res.status(500).json({
      error: 'Failed to add user to transaction',
      message: 'An internal error occurred'
    });
  }
}