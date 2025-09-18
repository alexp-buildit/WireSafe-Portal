const { query } = require('../../../../lib/db');
const { requireAuth, createAuditLog, getClientIP } = require('../../../../utils/auth');
const { sanitizeObject } = require('../../../../utils/validation');

export default async function handler(req, res) {
  await requireAuth(req, res, async () => {
    const { id } = req.query;

    if (req.method === 'POST') {
      return await addParticipantToTransaction(req, res, id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  });
}

async function addParticipantToTransaction(req, res, transactionId) {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes('main_escrow')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only main escrow officers can add participants to transactions'
      });
    }

    const sanitizedData = sanitizeObject(req.body);
    const { email, firstName, lastName, phoneNumber, companyName, role } = sanitizedData;

    if (!email || !firstName || !lastName || !phoneNumber || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, first name, last name, phone number, and role are required'
      });
    }

    const validRoles = ['buyer', 'seller', 'lender'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: ' + validRoles.join(', ')
      });
    }

    // Verify transaction exists and user has permission
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

    // Check if participant with this email already exists in this transaction
    const existingParticipant = await query(`
      SELECT id FROM transaction_participants
      WHERE transaction_id = $1 AND email = $2
    `, [transactionId, email]);

    if (existingParticipant.rows.length > 0) {
      return res.status(409).json({
        error: 'Participant already exists',
        message: `A participant with email ${email} is already in this transaction`
      });
    }

    // Add participant to transaction
    const result = await query(`
      INSERT INTO transaction_participants (
        transaction_id,
        email,
        first_name,
        last_name,
        phone_number,
        company_name,
        role,
        added_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [transactionId, email, firstName, lastName, phoneNumber, companyName || null, role]);

    const participant = result.rows[0];

    // Create audit log
    await createAuditLog(
      transactionId,
      userId,
      'PARTICIPANT_ADDED_TO_TRANSACTION',
      {
        participantEmail: email,
        participantName: `${firstName} ${lastName}`,
        role: role
      },
      getClientIP(req),
      req.headers['user-agent']
    );

    return res.status(201).json({
      message: 'Participant added to transaction successfully',
      participant: {
        id: participant.id,
        email: participant.email,
        firstName: participant.first_name,
        lastName: participant.last_name,
        phoneNumber: participant.phone_number,
        companyName: participant.company_name,
        role: participant.role,
        addedAt: participant.added_at
      }
    });

  } catch (error) {
    console.error('Add participant to transaction error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Participant already exists',
        message: 'This participant is already in this transaction'
      });
    }

    return res.status(500).json({
      error: 'Failed to add participant to transaction',
      message: 'An internal error occurred'
    });
  }
}