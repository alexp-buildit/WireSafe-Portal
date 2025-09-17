const Joi = require('joi');

const userRegistrationSchema = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(3).max(50).required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  phoneNumber: Joi.string().pattern(/^[\d\s\-\(\)\+\.]+$/).min(10).max(25).required(),
  companyName: Joi.string().max(255).allow('', null),
  password: Joi.string().min(8).required(),
  roles: Joi.array().items(Joi.string().valid('buyer', 'seller', 'lender', 'main_escrow', 'secondary_escrow')).min(1).required()
});

const userLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const transactionCreateSchema = Joi.object({
  propertyAddress: Joi.string().min(10).max(500).required(),
  purchaseAmount: Joi.number().positive().precision(2).required(),
  secondaryEscrowUsername: Joi.string().required()
});

const bankingInfoSchema = Joi.object({
  bankName: Joi.string().min(2).max(100).required(),
  accountNumber: Joi.string().min(4).max(20).required(),
  routingNumber: Joi.string().pattern(/^\d{9}$/).required(),
  accountHolderName: Joi.string().min(2).max(200).required(),
  amount: Joi.number().positive().precision(2).when('$isEscrow', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const routingNumberValidation = {
  isValid: (routingNumber) => {
    if (!/^\d{9}$/.test(routingNumber)) return false;

    const digits = routingNumber.split('').map(Number);
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8])
    ) % 10;

    return checksum === 0;
  }
};

function validateInput(schema, data, context = {}) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    context
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { isValid: false, errors: details };
  }

  return { isValid: true, data: value };
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  transactionCreateSchema,
  bankingInfoSchema,
  routingNumberValidation,
  validateInput,
  sanitizeString,
  sanitizeObject
};