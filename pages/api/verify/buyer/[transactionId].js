const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');
const { sanitizeObject } = require('../../../../utils/validation');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { transactionId } = req.query;

    if (req.method === 'POST') {
      return await processBuyerVerification(req, res, transactionId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function processBuyerVerification(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('buyer') && !userRoles.includes('lender')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only buyers and lenders can perform buyer verification'
      });
    }

    const accessCheck = await query(`
      SELECT tp.id FROM transaction_participants tp
      WHERE tp.transaction_id = $1 AND tp.user_id = $2 AND tp.role IN ('buyer', 'lender')
    `, [transactionId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Access denied',
        message: 'You are not a participant in this transaction or do not have buyer/lender role'
      });
    }

    const sanitizedData = sanitizeObject(req.body);
    const { actionType, actionData } = sanitizedData;

    const validActionTypes = [
      'VERIFY_OWN_BANKING_INFO',
      'VERIFY_ESCROW_BANKING_INFO',
      'AUTHORIZE_WIRE_TRANSFER',
      'CONFIRM_FUND_TRANSFER'
    ];

    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({
        error: 'Invalid action type',
        message: 'Action type must be one of: ' + validActionTypes.join(', ')
      });
    }

    let verificationResult;

    switch (actionType) {
      case 'VERIFY_OWN_BANKING_INFO':
        verificationResult = await verifyOwnBankingInfo(transactionId, userId, actionData);
        break;
      case 'VERIFY_ESCROW_BANKING_INFO':
        verificationResult = await verifyEscrowBankingInfo(transactionId, userId, actionData);
        break;
      case 'AUTHORIZE_WIRE_TRANSFER':
        verificationResult = await authorizeWireTransfer(transactionId, userId, actionData);
        break;
      case 'CONFIRM_FUND_TRANSFER':
        verificationResult = await confirmFundTransfer(transactionId, userId, actionData);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action type' });
    }

    if (!verificationResult.success) {
      return res.status(400).json({
        error: verificationResult.error,
        message: verificationResult.message
      });
    }

    const result = await query(`
      INSERT INTO verification_actions (transaction_id, user_id, action_type, action_data, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, verified_at
    `, [
      transactionId,
      userId,
      actionType,
      JSON.stringify(actionData),
      getClientIP(req),
      req.headers['user-agent']
    ]);

    const verification = result.rows[0];

    await createAuditLog(
      transactionId,
      userId,
      `BUYER_VERIFICATION_${actionType}`,
      {
        actionType,
        actionData,
        verificationId: verification.id
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'Buyer verification completed successfully',
      verification: {
        id: verification.id,
        actionType,
        verifiedAt: verification.verified_at,
        result: verificationResult.data
      }
    });

  } catch (error) {
    console.error('Buyer verification error:', error);
    return res.status(500).json({
      error: 'Failed to process buyer verification',
      message: 'An internal error occurred'
    });
  }
}

async function verifyOwnBankingInfo(transactionId, userId, actionData) {
  try {
    const { confirmed } = actionData;

    if (typeof confirmed !== 'boolean') {
      return {
        success: false,
        error: 'Invalid confirmation',
        message: 'Confirmation must be true or false'
      };
    }

    const bankingInfo = await query(`
      SELECT id FROM banking_information
      WHERE transaction_id = $1 AND user_id = $2
    `, [transactionId, userId]);

    if (bankingInfo.rows.length === 0) {
      return {
        success: false,
        error: 'Banking information not found',
        message: 'No banking information found for this user in this transaction'
      };
    }

    return {
      success: true,
      data: {
        bankingInfoVerified: confirmed,
        bankingInfoId: bankingInfo.rows[0].id
      }
    };
  } catch (error) {
    console.error('Verify own banking info error:', error);
    return {
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify banking information'
    };
  }
}

async function verifyEscrowBankingInfo(transactionId, userId, actionData) {
  try {
    const { escrowBankingInfoId, confirmed } = actionData;

    if (!escrowBankingInfoId || typeof confirmed !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Escrow banking info ID and confirmation are required'
      };
    }

    const escrowBankingInfo = await query(`
      SELECT bi.id, t.main_escrow_id, t.secondary_escrow_id
      FROM banking_information bi
      JOIN transactions t ON bi.transaction_id = t.id
      WHERE bi.id = $1 AND bi.transaction_id = $2
        AND (bi.user_id = t.main_escrow_id OR bi.user_id = t.secondary_escrow_id)
    `, [escrowBankingInfoId, transactionId]);

    if (escrowBankingInfo.rows.length === 0) {
      return {
        success: false,
        error: 'Escrow banking information not found',
        message: 'The specified escrow banking information does not exist'
      };
    }

    return {
      success: true,
      data: {
        escrowBankingInfoVerified: confirmed,
        escrowBankingInfoId
      }
    };
  } catch (error) {
    console.error('Verify escrow banking info error:', error);
    return {
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify escrow banking information'
    };
  }
}

async function authorizeWireTransfer(transactionId, userId, actionData) {
  try {
    const { wireAmount, bankingInfoId, authorized } = actionData;

    if (!wireAmount || !bankingInfoId || typeof authorized !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Wire amount, banking info ID, and authorization are required'
      };
    }

    const bankingInfo = await query(`
      SELECT id, amount FROM banking_information
      WHERE id = $1 AND transaction_id = $2 AND user_id = $3
    `, [bankingInfoId, transactionId, userId]);

    if (bankingInfo.rows.length === 0) {
      return {
        success: false,
        error: 'Banking information not found',
        message: 'Banking information not found for this user'
      };
    }

    const expectedAmount = parseFloat(bankingInfo.rows[0].amount);
    const providedAmount = parseFloat(wireAmount);

    if (Math.abs(expectedAmount - providedAmount) > 0.01) {
      return {
        success: false,
        error: 'Amount mismatch',
        message: `Wire amount ${providedAmount} does not match expected amount ${expectedAmount}`
      };
    }

    return {
      success: true,
      data: {
        wireTransferAuthorized: authorized,
        wireAmount: providedAmount,
        bankingInfoId
      }
    };
  } catch (error) {
    console.error('Authorize wire transfer error:', error);
    return {
      success: false,
      error: 'Authorization failed',
      message: 'Failed to authorize wire transfer'
    };
  }
}

async function confirmFundTransfer(transactionId, userId, actionData) {
  try {
    const { transferReference, transferDate, confirmed } = actionData;

    if (!transferReference || !transferDate || typeof confirmed !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Transfer reference, date, and confirmation are required'
      };
    }

    return {
      success: true,
      data: {
        fundTransferConfirmed: confirmed,
        transferReference,
        transferDate
      }
    };
  } catch (error) {
    console.error('Confirm fund transfer error:', error);
    return {
      success: false,
      error: 'Confirmation failed',
      message: 'Failed to confirm fund transfer'
    };
  }
}