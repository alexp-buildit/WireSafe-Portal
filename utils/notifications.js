const { query } = require('../lib/db');

async function createNotification(userId, transactionId, type, title, message) {
  try {
    await query(`
      INSERT INTO notifications (user_id, transaction_id, type, title, message)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, transactionId, type, title, message]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

async function notifyTransactionParticipants(transactionId, type, title, message, excludeUserId = null) {
  try {
    const participants = await query(`
      SELECT DISTINCT tp.user_id
      FROM transaction_participants tp
      WHERE tp.transaction_id = $1
        ${excludeUserId ? 'AND tp.user_id != $2' : ''}
    `, excludeUserId ? [transactionId, excludeUserId] : [transactionId]);

    for (const participant of participants.rows) {
      await createNotification(participant.user_id, transactionId, type, title, message);
    }

    const transaction = await query(`
      SELECT main_escrow_id, secondary_escrow_id
      FROM transactions
      WHERE id = $1
    `, [transactionId]);

    if (transaction.rows.length > 0) {
      const { main_escrow_id, secondary_escrow_id } = transaction.rows[0];

      if (main_escrow_id && (!excludeUserId || main_escrow_id !== excludeUserId)) {
        await createNotification(main_escrow_id, transactionId, type, title, message);
      }

      if (secondary_escrow_id && (!excludeUserId || secondary_escrow_id !== excludeUserId)) {
        await createNotification(secondary_escrow_id, transactionId, type, title, message);
      }
    }
  } catch (error) {
    console.error('Error notifying transaction participants:', error);
  }
}

const NotificationTypes = {
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  TRANSACTION_INVITATION: 'TRANSACTION_INVITATION',
  BANKING_INFO_REQUIRED: 'BANKING_INFO_REQUIRED',
  BANKING_INFO_APPROVED: 'BANKING_INFO_APPROVED',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  VERIFICATION_COMPLETED: 'VERIFICATION_COMPLETED',
  FUNDS_RECEIVED: 'FUNDS_RECEIVED',
  PAYMENT_AUTHORIZED: 'PAYMENT_AUTHORIZED',
  TRANSACTION_COMPLETED: 'TRANSACTION_COMPLETED',
  TRANSACTION_FLAGGED: 'TRANSACTION_FLAGGED',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  STATUS_CHANGED: 'STATUS_CHANGED'
};

module.exports = {
  createNotification,
  notifyTransactionParticipants,
  NotificationTypes
};