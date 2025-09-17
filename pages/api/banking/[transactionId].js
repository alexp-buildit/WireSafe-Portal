const { query } = require('../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../utils/auth');
const { encrypt, decrypt } = require('../../../utils/encryption');
const { validateInput, bankingInfoSchema, routingNumberValidation, sanitizeObject } = require('../../../utils/validation');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { transactionId } = req.query;

    if (req.method === 'POST') {
      return await submitBankingInfo(req, res, transactionId);
    } else if (req.method === 'GET') {
      return await getBankingInfo(req, res, transactionId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function submitBankingInfo(req, res, transactionId) {
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

    const sanitizedData = sanitizeObject(req.body);
    const isEscrow = req.user.roles && (req.user.roles.includes('main_escrow') || req.user.roles.includes('secondary_escrow'));

    const validation = validateInput(bankingInfoSchema, sanitizedData, { isEscrow });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { bankName, accountNumber, routingNumber, accountHolderName, amount } = validation.data;

    if (!routingNumberValidation.isValid(routingNumber)) {
      return res.status(400).json({
        error: 'Invalid routing number',
        message: 'The routing number failed validation checks'
      });
    }

    const existingBanking = await query(`
      SELECT id FROM banking_information
      WHERE transaction_id = $1 AND user_id = $2
    `, [transactionId, userId]);

    if (existingBanking.rows.length > 0) {
      return res.status(409).json({
        error: 'Banking information already exists',
        message: 'Banking information has already been submitted for this transaction'
      });
    }

    const encryptedBankName = encrypt(bankName);
    const encryptedAccountNumber = encrypt(accountNumber);
    const encryptedRoutingNumber = encrypt(routingNumber);
    const encryptedAccountHolderName = encrypt(accountHolderName);

    const result = await query(`
      INSERT INTO banking_information (
        transaction_id,
        user_id,
        bank_name_encrypted,
        account_number_encrypted,
        routing_number_encrypted,
        account_holder_name_encrypted,
        amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `, [
      transactionId,
      userId,
      encryptedBankName,
      encryptedAccountNumber,
      encryptedRoutingNumber,
      encryptedAccountHolderName,
      amount || null
    ]);

    const bankingInfo = result.rows[0];

    await createAuditLog(
      transactionId,
      userId,
      'BANKING_INFO_SUBMITTED',
      {
        bankName: bankName,
        amount: amount || null,
        hasRoutingNumber: !!routingNumber,
        hasAccountNumber: !!accountNumber
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'Banking information submitted successfully',
      bankingInfo: {
        id: bankingInfo.id,
        createdAt: bankingInfo.created_at,
        amount: amount || null
      }
    });

  } catch (error) {
    console.error('Submit banking info error:', error);
    return res.status(500).json({
      error: 'Failed to submit banking information',
      message: 'An internal error occurred'
    });
  }
}

async function getBankingInfo(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

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

    let bankingInfoQuery;
    let queryParams;

    if (userRoles.includes('main_escrow') || userRoles.includes('secondary_escrow')) {
      bankingInfoQuery = `
        SELECT
          bi.id,
          bi.user_id,
          bi.bank_name_encrypted,
          bi.account_number_encrypted,
          bi.routing_number_encrypted,
          bi.account_holder_name_encrypted,
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
      `;
      queryParams = [transactionId];
    } else {
      bankingInfoQuery = `
        SELECT
          bi.id,
          bi.user_id,
          bi.bank_name_encrypted,
          bi.account_number_encrypted,
          bi.routing_number_encrypted,
          bi.account_holder_name_encrypted,
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
        AND (
          bi.user_id = $2
          OR bi.approved_by_secondary_escrow = true
        )
        ORDER BY bi.created_at
      `;
      queryParams = [transactionId, userId];
    }

    const result = await query(bankingInfoQuery, queryParams);

    const bankingInfo = result.rows.map(row => {
      const canViewFullDetails = (
        userRoles.includes('main_escrow') ||
        userRoles.includes('secondary_escrow') ||
        row.user_id === userId
      );

      const decryptedInfo = canViewFullDetails ? {
        bankName: decrypt(row.bank_name_encrypted),
        accountNumber: decrypt(row.account_number_encrypted),
        routingNumber: decrypt(row.routing_number_encrypted),
        accountHolderName: decrypt(row.account_holder_name_encrypted)
      } : {
        bankName: '***',
        accountNumber: '***',
        routingNumber: '***',
        accountHolderName: '***'
      };

      return {
        id: row.id,
        userId: row.user_id,
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name,
        ...decryptedInfo,
        amount: row.amount ? parseFloat(row.amount) : null,
        approvedBySecondaryEscrow: row.approved_by_secondary_escrow,
        approvedByMainEscrow: row.approved_by_main_escrow,
        approvedAt: row.approved_at,
        createdAt: row.created_at
      };
    });

    await createAuditLog(
      transactionId,
      userId,
      'BANKING_INFO_VIEWED',
      { recordCount: bankingInfo.length },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      bankingInfo
    });

  } catch (error) {
    console.error('Get banking info error:', error);
    return res.status(500).json({
      error: 'Failed to fetch banking information',
      message: 'An internal error occurred'
    });
  }
}