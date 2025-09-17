const { query } = require('../../../lib/db');
const { requireAuth, requireRole, createAuditLog, getClientIP } = require('../../../utils/auth');
const { validateInput, transactionCreateSchema, sanitizeObject } = require('../../../utils/validation');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    if (req.method === 'GET') {
      return await getTransactions(req, res);
    } else if (req.method === 'POST') {
      return await createTransaction(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function getTransactions(req, res) {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT DISTINCT
        t.id,
        t.transaction_id,
        t.property_address,
        t.purchase_amount,
        t.status,
        t.created_at,
        t.updated_at,
        me.username as main_escrow_username,
        se.username as secondary_escrow_username,
        tp.role as user_role
      FROM transactions t
      LEFT JOIN users me ON t.main_escrow_id = me.id
      LEFT JOIN users se ON t.secondary_escrow_id = se.id
      LEFT JOIN transaction_participants tp ON t.id = tp.transaction_id AND tp.user_id = $1
      WHERE t.main_escrow_id = $1
         OR t.secondary_escrow_id = $1
         OR EXISTS (
           SELECT 1 FROM transaction_participants tp2
           WHERE tp2.transaction_id = t.id AND tp2.user_id = $1
         )
      ORDER BY t.created_at DESC
    `, [userId]);

    await createAuditLog(
      null,
      userId,
      'TRANSACTIONS_VIEWED',
      { count: result.rows.length },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      transactions: result.rows.map(row => ({
        id: row.id,
        transactionId: row.transaction_id,
        propertyAddress: row.property_address,
        purchaseAmount: parseFloat(row.purchase_amount),
        status: row.status,
        mainEscrowUsername: row.main_escrow_username,
        secondaryEscrowUsername: row.secondary_escrow_username,
        userRole: row.user_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      error: 'Failed to fetch transactions',
      message: 'An internal error occurred'
    });
  }
}

async function createTransaction(req, res) {
  const userRoles = req.user.roles || [];

  if (!userRoles.includes('main_escrow')) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Only main escrow officers can create transactions'
    });
  }

  try {
    const sanitizedData = sanitizeObject(req.body);
    const validation = validateInput(transactionCreateSchema, sanitizedData);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { propertyAddress, purchaseAmount, secondaryEscrowUsername } = validation.data;

    const secondaryEscrowResult = await query(
      'SELECT id, roles FROM users WHERE username = $1 AND is_active = true',
      [secondaryEscrowUsername]
    );

    if (secondaryEscrowResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Secondary escrow officer not found',
        message: 'The specified secondary escrow officer does not exist'
      });
    }

    const secondaryEscrow = secondaryEscrowResult.rows[0];
    const secondaryRoles = secondaryEscrow.roles || [];

    if (!secondaryRoles.includes('secondary_escrow')) {
      return res.status(400).json({
        error: 'Invalid secondary escrow officer',
        message: 'The specified user is not a secondary escrow officer'
      });
    }

    if (secondaryEscrow.id === req.user.id) {
      return res.status(400).json({
        error: 'Invalid assignment',
        message: 'Main and secondary escrow officers must be different users'
      });
    }

    const transactionResult = await query(`
      INSERT INTO transactions (property_address, purchase_amount, main_escrow_id, secondary_escrow_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, transaction_id, property_address, purchase_amount, status, created_at
    `, [propertyAddress, purchaseAmount, req.user.id, secondaryEscrow.id]);

    const transaction = transactionResult.rows[0];

    await query(`
      INSERT INTO transaction_participants (transaction_id, user_id, role)
      VALUES ($1, $2, $3), ($1, $4, $5)
    `, [
      transaction.id,
      req.user.id,
      'main_escrow',
      secondaryEscrow.id,
      'secondary_escrow'
    ]);

    await createAuditLog(
      transaction.id,
      req.user.id,
      'TRANSACTION_CREATED',
      {
        transactionId: transaction.transaction_id,
        propertyAddress,
        purchaseAmount,
        secondaryEscrowUsername
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'Transaction created successfully',
      transaction: {
        id: transaction.id,
        transactionId: transaction.transaction_id,
        propertyAddress: transaction.property_address,
        purchaseAmount: parseFloat(transaction.purchase_amount),
        status: transaction.status,
        createdAt: transaction.created_at
      }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({
      error: 'Failed to create transaction',
      message: 'An internal error occurred'
    });
  }
}