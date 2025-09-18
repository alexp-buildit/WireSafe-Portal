const { query } = require('../../../lib/db');
const { hashPassword } = require('../../../utils/encryption');
const { generateToken, createAuditLog, getClientIP } = require('../../../utils/auth');
const { validateInput, userRegistrationSchema, sanitizeObject } = require('../../../utils/validation');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Raw request body:', { ...req.body, password: '[HIDDEN]' });
    console.log('Raw roles:', req.body.roles, 'Type:', typeof req.body.roles, 'Is Array:', Array.isArray(req.body.roles));

    const sanitizedData = sanitizeObject(req.body);
    console.log('Sanitized data:', { ...sanitizedData, password: '[HIDDEN]' });
    console.log('Sanitized roles:', sanitizedData.roles, 'Type:', typeof sanitizedData.roles, 'Is Array:', Array.isArray(sanitizedData.roles));

    const validation = validateInput(userRegistrationSchema, sanitizedData);

    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors);
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input and try again',
        details: validation.errors
      });
    }

    const {
      username,
      email,
      firstName,
      lastName,
      phoneNumber,
      companyName,
      password,
      roles
    } = validation.data;

    const existingUserResult = await query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username, email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username or email already registered'
      });
    }

    const passwordHash = hashPassword(password);

    const result = await query(
      `INSERT INTO users (username, email, first_name, last_name, phone_number, company_name, password_hash, roles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, first_name, last_name, phone_number, company_name, roles`,
      [username, email, firstName, lastName, phoneNumber, companyName || null, passwordHash, roles]
    );

    const user = result.rows[0];

    const token = generateToken({
      userId: user.id,
      username: user.username,
      roles: user.roles
    });

    await createAuditLog(
      null,
      user.id,
      'USER_REGISTERED',
      { username, email, roles },
      getClientIP(req),
      req.headers['user-agent']
    );

    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);

    return res.status(201).json({
      message: 'User registered successfully',
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
    console.error('Registration error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username or email already registered'
      });
    }

    return res.status(500).json({
      error: 'Registration failed',
      message: 'An internal error occurred'
    });
  }
}