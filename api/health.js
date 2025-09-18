const { query } = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {}
  };

  try {
    const dbResult = await query('SELECT NOW() as current_time');
    healthCheck.checks.database = {
      status: 'ok',
      response_time: Date.now(),
      last_check: dbResult.rows[0].current_time
    };
  } catch (error) {
    healthCheck.status = 'error';
    healthCheck.checks.database = {
      status: 'error',
      error: error.message,
      last_check: new Date().toISOString()
    };
  }

  try {
    const memoryUsage = process.memoryUsage();
    healthCheck.checks.memory = {
      status: 'ok',
      usage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      }
    };
  } catch (error) {
    healthCheck.checks.memory = {
      status: 'error',
      error: error.message
    };
  }

  healthCheck.checks.environment_variables = {
    status: checkEnvironmentVariables() ? 'ok' : 'warning',
    required_vars_present: checkEnvironmentVariables()
  };

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.status(statusCode).json(healthCheck);
}

function checkEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'ENCRYPTION_IV'
  ];

  return requiredVars.every(varName => !!process.env[varName]);
}