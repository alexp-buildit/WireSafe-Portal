const { query } = require('../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../utils/auth');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id } = req.query;

    if (req.method === 'GET') {
      return await getTransactionDetails(req, res, id);
    } else if (req.method === 'PUT') {
      return await updateTransaction(req, res, id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function getTransactionDetails(req, res, transactionId) {
  try {
    const userId = req.user.id;

    const accessCheck = await query(`
      SELECT t.id FROM transactions t
      WHERE t.id = $1
        AND (
          t.main_escrow_id = $2
          OR t.secondary_escrow_id = $2
          OR EXISTS (
            SELECT 1 FROM transaction_participants tp
            WHERE tp.transaction_id = t.id AND tp.user_id = $2
          )
        )
    `, [transactionId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Transaction does not exist or you do not have access'
      });
    }

    const transactionResult = await query(`
      SELECT
        t.id,
        t.transaction_id,
        t.property_address,
        t.purchase_amount,
        t.status,
        t.created_at,
        t.updated_at,
        me.username as main_escrow_username,
        me.first_name as main_escrow_first_name,
        me.last_name as main_escrow_last_name,
        se.username as secondary_escrow_username,
        se.first_name as secondary_escrow_first_name,
        se.last_name as secondary_escrow_last_name
      FROM transactions t
      LEFT JOIN users me ON t.main_escrow_id = me.id
      LEFT JOIN users se ON t.secondary_escrow_id = se.id
      WHERE t.id = $1
    `, [transactionId]);

    const participantsResult = await query(`
      SELECT
        tp.role,
        tp.added_at,
        COALESCE(u.id, 0) as id,
        COALESCE(u.username, '') as username,
        COALESCE(u.first_name, tp.first_name) as first_name,
        COALESCE(u.last_name, tp.last_name) as last_name,
        COALESCE(u.email, tp.email) as email,
        COALESCE(u.phone_number, tp.phone_number) as phone_number,
        COALESCE(u.company_name, tp.company_name) as company_name
      FROM transaction_participants tp
      LEFT JOIN users u ON tp.user_id = u.id
      WHERE tp.transaction_id = $1
      ORDER BY tp.added_at
    `, [transactionId]);

    const bankingInfoResult = await query(`
      SELECT
        bi.id,
        bi.user_id,
        bi.amount,
        bi.approved_by_secondary_escrow,
        bi.approved_by_main_escrow,
        bi.approved_at,
        bi.created_at,
        u.username,
        u.first_name,
        u.last_name
      FROM banking_information bi
      JOIN users u ON bi.user_id = u.id
      WHERE bi.transaction_id = $1
      ORDER BY bi.created_at
    `, [transactionId]);

    const verificationActionsResult = await query(`
      SELECT
        va.id,
        va.action_type,
        va.action_data,
        va.verified_at,
        u.username,
        u.first_name,
        u.last_name
      FROM verification_actions va
      JOIN users u ON va.user_id = u.id
      WHERE va.transaction_id = $1
      ORDER BY va.verified_at DESC
    `, [transactionId]);

    const transaction = transactionResult.rows[0];

    await createAuditLog(
      transactionId,
      userId,
      'TRANSACTION_DETAILS_VIEWED',
      { transactionId: transaction.transaction_id },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      transaction: {
        id: transaction.id,
        transactionId: transaction.transaction_id,
        propertyAddress: transaction.property_address,
        purchaseAmount: parseFloat(transaction.purchase_amount),
        status: transaction.status,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        mainEscrow: {
          username: transaction.main_escrow_username,
          firstName: transaction.main_escrow_first_name,
          lastName: transaction.main_escrow_last_name
        },
        secondaryEscrow: {
          username: transaction.secondary_escrow_username,
          firstName: transaction.secondary_escrow_first_name,
          lastName: transaction.secondary_escrow_last_name
        }
      },
      participants: participantsResult.rows.map(p => ({
        id: p.id,
        username: p.username,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        phoneNumber: p.phone_number,
        companyName: p.company_name,
        role: p.role,
        addedAt: p.added_at
      })),
      bankingInfo: bankingInfoResult.rows.map(bi => ({
        id: bi.id,
        userId: bi.user_id,
        username: bi.username,
        firstName: bi.first_name,
        lastName: bi.last_name,
        amount: bi.amount ? parseFloat(bi.amount) : null,
        approvedBySecondaryEscrow: bi.approved_by_secondary_escrow,
        approvedByMainEscrow: bi.approved_by_main_escrow,
        approvedAt: bi.approved_at,
        createdAt: bi.created_at
      })),
      verificationActions: verificationActionsResult.rows.map(va => ({
        id: va.id,
        actionType: va.action_type,
        actionData: va.action_data,
        verifiedAt: va.verified_at,
        username: va.username,
        firstName: va.first_name,
        lastName: va.last_name
      }))
    });

  } catch (error) {
    console.error('Get transaction details error:', error);
    return res.status(500).json({
      error: 'Failed to fetch transaction details',
      message: 'An internal error occurred'
    });
  }
}

async function updateTransaction(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Status is required'
      });
    }

    const validStatuses = ['setup', 'banking_info', 'buyer_verification', 'seller_verification', 'completed', 'flagged'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: ' + validStatuses.join(', ')
      });
    }

    const accessCheck = await query(`
      SELECT t.id, t.status as current_status FROM transactions t
      WHERE t.id = $1
        AND (t.main_escrow_id = $2 OR t.secondary_escrow_id = $2)
    `, [transactionId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
        message: 'Transaction does not exist or you do not have permission to update it'
      });
    }

    const currentStatus = accessCheck.rows[0].current_status;

    const result = await query(`
      UPDATE transactions
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, transaction_id, status, updated_at
    `, [status, transactionId]);

    const transaction = result.rows[0];

    await createAuditLog(
      transactionId,
      userId,
      'TRANSACTION_STATUS_UPDATED',
      {
        transactionId: transaction.transaction_id,
        oldStatus: currentStatus,
        newStatus: status
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: {
        id: transaction.id,
        transactionId: transaction.transaction_id,
        status: transaction.status,
        updatedAt: transaction.updated_at
      }
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    return res.status(500).json({
      error: 'Failed to update transaction',
      message: 'An internal error occurred'
    });
  }
}