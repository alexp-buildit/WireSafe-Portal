const { createAuditLog } = require('./auth');

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

function handleDatabaseError(error) {
  console.error('Database error:', error);

  switch (error.code) {
    case '23505':
      return new ConflictError('Resource already exists', error.detail);
    case '23503':
      return new ValidationError('Referenced resource does not exist', error.detail);
    case '23502':
      return new ValidationError('Required field is missing', error.detail);
    case '42P01':
      return new DatabaseError('Database table does not exist');
    case '42703':
      return new DatabaseError('Database column does not exist');
    case '28P01':
      return new DatabaseError('Database authentication failed');
    case '53300':
      return new DatabaseError('Too many database connections');
    default:
      return new DatabaseError('Database operation failed', error);
  }
}

function handleJWTError(error) {
  console.error('JWT error:', error);

  switch (error.name) {
    case 'JsonWebTokenError':
      return new AuthenticationError('Invalid authentication token');
    case 'TokenExpiredError':
      return new AuthenticationError('Authentication token has expired');
    case 'NotBeforeError':
      return new AuthenticationError('Authentication token not yet valid');
    default:
      return new AuthenticationError('Authentication token error');
  }
}

function handleValidationError(error) {
  console.error('Validation error:', error);

  if (error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return new ValidationError('Input validation failed', details);
  }

  return new ValidationError(error.message);
}

async function globalErrorHandler(error, req, res, transactionId = null) {
  let handledError = error;

  if (!(error instanceof AppError)) {
    if (error.code && error.code.startsWith('23')) {
      handledError = handleDatabaseError(error);
    } else if (error.name && error.name.includes('JsonWebToken')) {
      handledError = handleJWTError(error);
    } else if (error.isJoi) {
      handledError = handleValidationError(error);
    } else {
      console.error('Unhandled error:', error);
      handledError = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
    }
  }

  const userId = req.user?.id || null;
  const ipAddress = req.headers['x-forwarded-for'] ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   req.socket?.remoteAddress ||
                   'unknown';

  await createAuditLog(
    transactionId,
    userId,
    'ERROR_OCCURRED',
    {
      errorCode: handledError.code,
      errorMessage: handledError.message,
      statusCode: handledError.statusCode,
      originalError: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    ipAddress,
    req.headers['user-agent']
  );

  const errorResponse = {
    error: handledError.code || 'UNKNOWN_ERROR',
    message: handledError.message,
    statusCode: handledError.statusCode
  };

  if (handledError.details) {
    errorResponse.details = handledError.details;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = handledError.stack;
    errorResponse.originalError = error.message;
  }

  return res.status(handledError.statusCode || 500).json(errorResponse);
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function validateRequiredFields(obj, requiredFields) {
  const missingFields = requiredFields.filter(field => {
    return obj[field] === undefined || obj[field] === null || obj[field] === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

function validateUUID(value, fieldName = 'ID') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>'"]/g, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

function createErrorResponse(message, statusCode = 500, code = null, details = null) {
  return {
    error: code || 'ERROR',
    message,
    statusCode,
    ...(details && { details })
  };
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  handleDatabaseError,
  handleJWTError,
  handleValidationError,
  globalErrorHandler,
  asyncHandler,
  validateRequiredFields,
  validateUUID,
  sanitizeInput,
  createErrorResponse
};