const { query } = require('../../../lib/db');
const { comparePassword } = require('../../../utils/encryption');
const { generateToken, createAuditLog, getClientIP } = require('../../../utils/auth');
const { validateInput, userLoginSchema, sanitizeObject } = require('../../../utils/validation');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sanitizedData = sanitizeObject(req.body);
    const validation = validateInput(userLoginSchema, sanitizedData);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const { username, password } = validation.data;

    const result = await query(
      'SELECT id, username, email, first_name, last_name, phone_number, company_name, password_hash, roles, is_active FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (result.rows.length === 0) {
      await createAuditLog(
        null,
        null,
        'LOGIN_FAILED',
        { username, reason: 'User not found' },
        getClientIP(req),
        req.headers['user-agent']
      );

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      await createAuditLog(
        null,
        user.id,
        'LOGIN_FAILED',
        { username, reason: 'Account inactive' },
        getClientIP(req),
        req.headers['user-agent']
      );

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Account is inactive'
      });
    }

    const isPasswordValid = comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      await createAuditLog(
        null,
        user.id,
        'LOGIN_FAILED',
        { username, reason: 'Invalid password' },
        getClientIP(req),
        req.headers['user-agent']
      );

      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      roles: user.roles
    });

    await createAuditLog(
      null,
      user.id,
      'LOGIN_SUCCESS',
      { username },
      getClientIP(req),
      req.headers['user-agent']
    );

    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        companyName: user.company_name,
        roles: user.roles
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      message: 'An internal error occurred'
    });
  }
}