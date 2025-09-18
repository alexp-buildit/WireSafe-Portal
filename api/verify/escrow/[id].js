const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');
const { sanitizeObject } = require('../../../../utils/validation');

module.exports = async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id: transactionId } = req.query;

    if (req.method === 'POST') {
      return await processEscrowVerification(req, res, transactionId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function processEscrowVerification(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('main_escrow') && !userRoles.includes('secondary_escrow')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only escrow officers can perform escrow verification'
      });
    }

    const accessCheck = await query(`
      SELECT t.id, t.main_escrow_id, t.secondary_escrow_id FROM transactions t
      WHERE t.id = $1 AND (t.main_escrow_id = $2 OR t.secondary_escrow_id = $2)
    `, [transactionId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Access denied',
        message: 'You are not an escrow officer for this transaction'
      });
    }

    const transaction = accessCheck.rows[0];
    const isMainEscrow = transaction.main_escrow_id === userId;
    const isSecondaryEscrow = transaction.secondary_escrow_id === userId;

    const sanitizedData = sanitizeObject(req.body);
    const { actionType, actionData } = sanitizedData;

    const validActionTypes = [
      'VERIFY_FUND_RECEIPT',
      'VERIFY_SELLER_IDENTITY',
      'CONFIRM_SELLER_BANKING_INFO',
      'AUTHORIZE_SELLER_PAYMENT',
      'FLAG_SUSPICIOUS_ACTIVITY'
    ];

    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({
        error: 'Invalid action type',
        message: 'Action type must be one of: ' + validActionTypes.join(', ')
      });
    }

    let verificationResult;

    switch (actionType) {
      case 'VERIFY_FUND_RECEIPT':
        verificationResult = await verifyFundReceipt(transactionId, userId, actionData, isMainEscrow);
        break;
      case 'VERIFY_SELLER_IDENTITY':
        verificationResult = await verifySellerIdentityAsEscrow(transactionId, userId, actionData, isMainEscrow);
        break;
      case 'CONFIRM_SELLER_BANKING_INFO':
        verificationResult = await confirmSellerBankingInfo(transactionId, userId, actionData, isMainEscrow, isSecondaryEscrow);
        break;
      case 'AUTHORIZE_SELLER_PAYMENT':
        verificationResult = await authorizeSellerPayment(transactionId, userId, actionData, isMainEscrow, isSecondaryEscrow);
        break;
      case 'FLAG_SUSPICIOUS_ACTIVITY':
        verificationResult = await flagSuspiciousActivity(transactionId, userId, actionData);
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

    if (actionType === 'FLAG_SUSPICIOUS_ACTIVITY') {
      await query(`
        UPDATE transactions
        SET status = 'flagged'
        WHERE id = $1
      `, [transactionId]);
    }

    await createAuditLog(
      transactionId,
      userId,
      `ESCROW_VERIFICATION_${actionType}`,
      {
        actionType,
        actionData,
        verificationId: verification.id,
        escrowRole: isMainEscrow ? 'main_escrow' : 'secondary_escrow'
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'Escrow verification completed successfully',
      verification: {
        id: verification.id,
        actionType,
        verifiedAt: verification.verified_at,
        result: verificationResult.data
      }
    });

  } catch (error) {
    console.error('Escrow verification error:', error);
    return res.status(500).json({
      error: 'Failed to process escrow verification',
      message: 'An internal error occurred'
    });
  }
}

async function verifyFundReceipt(transactionId, userId, actionData, isMainEscrow) {
  try {
    const { buyerUserId, expectedAmount, receivedAmount, verified, reference } = actionData;

    if (!buyerUserId || !expectedAmount || !receivedAmount || typeof verified !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Buyer user ID, expected amount, received amount, and verification status are required'
      };
    }

    const buyerBanking = await query(`
      SELECT bi.id, bi.amount FROM banking_information bi
      JOIN transaction_participants tp ON bi.user_id = tp.user_id
      WHERE bi.transaction_id = $1 AND bi.user_id = $2 AND tp.role IN ('buyer', 'lender')
    `, [transactionId, buyerUserId]);

    if (buyerBanking.rows.length === 0) {
      return {
        success: false,
        error: 'Buyer banking information not found',
        message: 'No banking information found for this buyer'
      };
    }

    const bankingAmount = parseFloat(buyerBanking.rows[0].amount);
    const expected = parseFloat(expectedAmount);
    const received = parseFloat(receivedAmount);

    if (Math.abs(bankingAmount - expected) > 0.01) {
      return {
        success: false,
        error: 'Amount mismatch',
        message: `Expected amount ${expected} does not match banking info amount ${bankingAmount}`
      };
    }

    return {
      success: true,
      data: {
        fundReceiptVerified: verified,
        buyerUserId,
        expectedAmount: expected,
        receivedAmount: received,
        reference: reference || null,
        verifiedBy: isMainEscrow ? 'main_escrow' : 'secondary_escrow'
      }
    };
  } catch (error) {
    console.error('Verify fund receipt error:', error);
    return {
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify fund receipt'
    };
  }
}

async function verifySellerIdentityAsEscrow(transactionId, userId, actionData, isMainEscrow) {
  try {
    const { sellerUserId, identityDocuments, verified } = actionData;

    if (!sellerUserId || !identityDocuments || typeof verified !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Seller user ID, identity documents, and verification status are required'
      };
    }

    const sellerCheck = await query(`
      SELECT tp.id FROM transaction_participants tp
      WHERE tp.transaction_id = $1 AND tp.user_id = $2 AND tp.role = 'seller'
    `, [transactionId, sellerUserId]);

    if (sellerCheck.rows.length === 0) {
      return {
        success: false,
        error: 'Seller not found',
        message: 'Seller not found in this transaction'
      };
    }

    return {
      success: true,
      data: {
        sellerIdentityVerified: verified,
        sellerUserId,
        identityDocuments: identityDocuments,
        verifiedBy: isMainEscrow ? 'main_escrow' : 'secondary_escrow'
      }
    };
  } catch (error) {
    console.error('Verify seller identity as escrow error:', error);
    return {
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify seller identity'
    };
  }
}

async function confirmSellerBankingInfo(transactionId, userId, actionData, isMainEscrow, isSecondaryEscrow) {
  try {
    const { sellerUserId, confirmed } = actionData;

    if (!sellerUserId || typeof confirmed !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Seller user ID and confirmation are required'
      };
    }

    const sellerBanking = await query(`
      SELECT bi.id, bi.approved_by_main_escrow, bi.approved_by_secondary_escrow
      FROM banking_information bi
      JOIN transaction_participants tp ON bi.user_id = tp.user_id
      WHERE bi.transaction_id = $1 AND bi.user_id = $2 AND tp.role = 'seller'
    `, [transactionId, sellerUserId]);

    if (sellerBanking.rows.length === 0) {
      return {
        success: false,
        error: 'Seller banking information not found',
        message: 'No banking information found for this seller'
      };
    }

    const banking = sellerBanking.rows[0];

    if (!banking.approved_by_main_escrow || !banking.approved_by_secondary_escrow) {
      return {
        success: false,
        error: 'Banking information not approved',
        message: 'Banking information must be approved by both escrow officers'
      };
    }

    return {
      success: true,
      data: {
        sellerBankingInfoConfirmed: confirmed,
        sellerUserId,
        confirmedBy: isMainEscrow ? 'main_escrow' : 'secondary_escrow'
      }
    };
  } catch (error) {
    console.error('Confirm seller banking info error:', error);
    return {
      success: false,
      error: 'Confirmation failed',
      message: 'Failed to confirm seller banking information'
    };
  }
}

async function authorizeSellerPayment(transactionId, userId, actionData, isMainEscrow, isSecondaryEscrow) {
  try {
    const { sellerUserId, paymentAmount, authorized } = actionData;

    if (!sellerUserId || !paymentAmount || typeof authorized !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Seller user ID, payment amount, and authorization are required'
      };
    }

    const transaction = await query(`
      SELECT purchase_amount FROM transactions
      WHERE id = $1
    `, [transactionId]);

    if (transaction.rows.length === 0) {
      return {
        success: false,
        error: 'Transaction not found',
        message: 'Transaction not found'
      };
    }

    const totalAmount = parseFloat(transaction.rows[0].purchase_amount);
    const payment = parseFloat(paymentAmount);

    if (payment > totalAmount) {
      return {
        success: false,
        error: 'Payment amount too high',
        message: `Payment amount ${payment} exceeds total transaction amount ${totalAmount}`
      };
    }

    return {
      success: true,
      data: {
        sellerPaymentAuthorized: authorized,
        sellerUserId,
        paymentAmount: payment,
        authorizedBy: isMainEscrow ? 'main_escrow' : 'secondary_escrow'
      }
    };
  } catch (error) {
    console.error('Authorize seller payment error:', error);
    return {
      success: false,
      error: 'Authorization failed',
      message: 'Failed to authorize seller payment'
    };
  }
}

async function flagSuspiciousActivity(transactionId, userId, actionData) {
  try {
    const { reason, description, severity } = actionData;

    if (!reason || !description) {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Reason and description are required'
      };
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return {
        success: false,
        error: 'Invalid severity',
        message: 'Severity must be one of: ' + validSeverities.join(', ')
      };
    }

    return {
      success: true,
      data: {
        flagged: true,
        reason,
        description,
        severity: severity || 'medium',
        flaggedBy: userId
      }
    };
  } catch (error) {
    console.error('Flag suspicious activity error:', error);
    return {
      success: false,
      error: 'Flagging failed',
      message: 'Failed to flag suspicious activity'
    };
  }
}