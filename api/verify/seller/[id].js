const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');
const { sanitizeObject } = require('../../../../utils/validation');

module.exports = async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id: transactionId } = req.query;

    if (req.method === 'POST') {
      return await processSellerVerification(req, res, transactionId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function processSellerVerification(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('seller')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only sellers can perform seller verification'
      });
    }

    const accessCheck = await query(`
      SELECT tp.id FROM transaction_participants tp
      WHERE tp.transaction_id = $1 AND tp.user_id = $2 AND tp.role = 'seller'
    `, [transactionId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Access denied',
        message: 'You are not a seller participant in this transaction'
      });
    }

    const sanitizedData = sanitizeObject(req.body);
    const { actionType, actionData } = sanitizedData;

    const validActionTypes = [
      'VERIFY_OWN_BANKING_INFO',
      'CONFIRM_PROPERTY_INFORMATION',
      'ACKNOWLEDGE_PAYMENT_RECEIPT',
      'VERIFY_IDENTITY'
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
        verificationResult = await verifySellerBankingInfo(transactionId, userId, actionData);
        break;
      case 'CONFIRM_PROPERTY_INFORMATION':
        verificationResult = await confirmPropertyInformation(transactionId, userId, actionData);
        break;
      case 'ACKNOWLEDGE_PAYMENT_RECEIPT':
        verificationResult = await acknowledgePaymentReceipt(transactionId, userId, actionData);
        break;
      case 'VERIFY_IDENTITY':
        verificationResult = await verifySellerIdentity(transactionId, userId, actionData);
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
      `SELLER_VERIFICATION_${actionType}`,
      {
        actionType,
        actionData,
        verificationId: verification.id
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'Seller verification completed successfully',
      verification: {
        id: verification.id,
        actionType,
        verifiedAt: verification.verified_at,
        result: verificationResult.data
      }
    });

  } catch (error) {
    console.error('Seller verification error:', error);
    return res.status(500).json({
      error: 'Failed to process seller verification',
      message: 'An internal error occurred'
    });
  }
}

async function verifySellerBankingInfo(transactionId, userId, actionData) {
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
      SELECT id, approved_by_secondary_escrow, approved_by_main_escrow FROM banking_information
      WHERE transaction_id = $1 AND user_id = $2
    `, [transactionId, userId]);

    if (bankingInfo.rows.length === 0) {
      return {
        success: false,
        error: 'Banking information not found',
        message: 'No banking information found for this seller in this transaction'
      };
    }

    const info = bankingInfo.rows[0];

    if (!info.approved_by_secondary_escrow || !info.approved_by_main_escrow) {
      return {
        success: false,
        error: 'Banking information not approved',
        message: 'Banking information must be approved by both escrow officers before seller verification'
      };
    }

    return {
      success: true,
      data: {
        bankingInfoVerified: confirmed,
        bankingInfoId: info.id
      }
    };
  } catch (error) {
    console.error('Verify seller banking info error:', error);
    return {
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify banking information'
    };
  }
}

async function confirmPropertyInformation(transactionId, userId, actionData) {
  try {
    const { propertyAddress, confirmed } = actionData;

    if (!propertyAddress || typeof confirmed !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Property address and confirmation are required'
      };
    }

    const transaction = await query(`
      SELECT property_address FROM transactions
      WHERE id = $1
    `, [transactionId]);

    if (transaction.rows.length === 0) {
      return {
        success: false,
        error: 'Transaction not found',
        message: 'Transaction not found'
      };
    }

    const actualAddress = transaction.rows[0].property_address;

    if (propertyAddress.trim().toLowerCase() !== actualAddress.trim().toLowerCase()) {
      return {
        success: false,
        error: 'Property address mismatch',
        message: 'Provided property address does not match transaction records'
      };
    }

    return {
      success: true,
      data: {
        propertyInformationConfirmed: confirmed,
        propertyAddress: actualAddress
      }
    };
  } catch (error) {
    console.error('Confirm property information error:', error);
    return {
      success: false,
      error: 'Confirmation failed',
      message: 'Failed to confirm property information'
    };
  }
}

async function acknowledgePaymentReceipt(transactionId, userId, actionData) {
  try {
    const { paymentAmount, paymentDate, paymentReference, acknowledged } = actionData;

    if (!paymentAmount || !paymentDate || typeof acknowledged !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Payment amount, date, and acknowledgment are required'
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

    const expectedAmount = parseFloat(transaction.rows[0].purchase_amount);
    const receivedAmount = parseFloat(paymentAmount);

    if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
      return {
        success: false,
        error: 'Payment amount mismatch',
        message: `Received amount ${receivedAmount} does not match expected amount ${expectedAmount}`
      };
    }

    return {
      success: true,
      data: {
        paymentReceiptAcknowledged: acknowledged,
        paymentAmount: receivedAmount,
        paymentDate,
        paymentReference: paymentReference || null
      }
    };
  } catch (error) {
    console.error('Acknowledge payment receipt error:', error);
    return {
      success: false,
      error: 'Acknowledgment failed',
      message: 'Failed to acknowledge payment receipt'
    };
  }
}

async function verifySellerIdentity(transactionId, userId, actionData) {
  try {
    const { fullName, lastFourSSN, verified } = actionData;

    if (!fullName || !lastFourSSN || typeof verified !== 'boolean') {
      return {
        success: false,
        error: 'Invalid data',
        message: 'Full name, last four SSN digits, and verification status are required'
      };
    }

    if (!/^\d{4}$/.test(lastFourSSN)) {
      return {
        success: false,
        error: 'Invalid SSN format',
        message: 'Last four SSN digits must be exactly 4 digits'
      };
    }

    const user = await query(`
      SELECT first_name, last_name FROM users
      WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return {
        success: false,
        error: 'User not found',
        message: 'User not found'
      };
    }

    const userFullName = `${user.rows[0].first_name} ${user.rows[0].last_name}`;

    if (fullName.trim().toLowerCase() !== userFullName.trim().toLowerCase()) {
      return {
        success: false,
        error: 'Name mismatch',
        message: 'Provided name does not match user records'
      };
    }

    return {
      success: true,
      data: {
        identityVerified: verified,
        fullName: userFullName,
        lastFourSSNProvided: true
      }
    };
  } catch (error) {
    console.error('Verify seller identity error:', error);
    return {
      success: false,
      error: 'Verification failed',
      message: 'Failed to verify seller identity'
    };
  }
}