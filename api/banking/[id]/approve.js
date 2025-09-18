const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id } = req.query;

    if (req.method === 'PUT') {
      return await approveBankingInfo(req, res, id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function approveBankingInfo(req, res, bankingInfoId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('main_escrow') && !userRoles.includes('secondary_escrow')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only escrow officers can approve banking information'
      });
    }

    const bankingInfoResult = await query(`
      SELECT
        bi.id,
        bi.transaction_id,
        bi.user_id,
        bi.approved_by_secondary_escrow,
        bi.approved_by_main_escrow,
        t.main_escrow_id,
        t.secondary_escrow_id,
        u.username as account_holder_username
      FROM banking_information bi
      JOIN transactions t ON bi.transaction_id = t.id
      JOIN users u ON bi.user_id = u.id
      WHERE bi.id = $1
    `, [bankingInfoId]);

    if (bankingInfoResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Banking information not found',
        message: 'The specified banking information does not exist'
      });
    }

    const bankingInfo = bankingInfoResult.rows[0];

    const isMainEscrow = bankingInfo.main_escrow_id === userId;
    const isSecondaryEscrow = bankingInfo.secondary_escrow_id === userId;

    if (!isMainEscrow && !isSecondaryEscrow) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to approve banking information for this transaction'
      });
    }

    let updateQuery;
    let updateParams;
    let approvalType;

    if (isMainEscrow) {
      if (bankingInfo.approved_by_main_escrow) {
        return res.status(409).json({
          error: 'Already approved',
          message: 'Banking information has already been approved by main escrow'
        });
      }
      updateQuery = `
        UPDATE banking_information
        SET approved_by_main_escrow = true, approved_at = COALESCE(approved_at, NOW())
        WHERE id = $1
        RETURNING approved_by_main_escrow, approved_by_secondary_escrow, approved_at
      `;
      updateParams = [bankingInfoId];
      approvalType = 'MAIN_ESCROW';
    } else if (isSecondaryEscrow) {
      if (bankingInfo.approved_by_secondary_escrow) {
        return res.status(409).json({
          error: 'Already approved',
          message: 'Banking information has already been approved by secondary escrow'
        });
      }
      updateQuery = `
        UPDATE banking_information
        SET approved_by_secondary_escrow = true, approved_at = COALESCE(approved_at, NOW())
        WHERE id = $1
        RETURNING approved_by_main_escrow, approved_by_secondary_escrow, approved_at
      `;
      updateParams = [bankingInfoId];
      approvalType = 'SECONDARY_ESCROW';
    }

    const result = await query(updateQuery, updateParams);
    const updatedInfo = result.rows[0];

    const isFullyApproved = updatedInfo.approved_by_main_escrow && updatedInfo.approved_by_secondary_escrow;

    await createAuditLog(
      bankingInfo.transaction_id,
      userId,
      'BANKING_INFO_APPROVED',
      {
        bankingInfoId,
        accountHolderUsername: bankingInfo.account_holder_username,
        approvalType,
        fullyApproved: isFullyApproved
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(200).json({
      message: 'Banking information approved successfully',
      approval: {
        id: bankingInfoId,
        approvedByMainEscrow: updatedInfo.approved_by_main_escrow,
        approvedBySecondaryEscrow: updatedInfo.approved_by_secondary_escrow,
        approvedAt: updatedInfo.approved_at,
        fullyApproved: isFullyApproved
      }
    });

  } catch (error) {
    console.error('Approve banking info error:', error);
    return res.status(500).json({
      error: 'Failed to approve banking information',
      message: 'An internal error occurred'
    });
  }
}