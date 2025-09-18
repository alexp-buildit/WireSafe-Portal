const { requireAuth, createAuditLog, getClientIP } = require('../../../utils/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await requireAuth(req, res, async () => {
    try {
      await createAuditLog(
        null,
        req.user.id,
        'PROFILE_ACCESSED',
        {},
        getClientIP(req),
        req.headers['user-agent']
      );

      return res.status(200).json({
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          phoneNumber: req.user.phone_number,
          companyName: req.user.company_name,
          roles: req.user.roles
        }
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch profile',
        message: 'An internal error occurred'
      });
    }
  });
}