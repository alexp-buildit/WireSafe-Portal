const { requireAuth, createAuditLog, getClientIP } = require('../../../utils/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await requireAuth(req, res, async () => {
    try {
      await createAuditLog(
        null,
        req.user.id,
        'LOGOUT',
        {},
        getClientIP(req),
        req.headers['user-agent']
      );

      res.setHeader('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');

      return res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An internal error occurred'
      });
    }
  });
}