import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().max(254).lowercase().trim().required(),
  password: Joi.string()
    .min(12).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .message('Password must have 12+ chars, upper, lower, number, special')
    .required(),
  firstName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s'-]+$/).trim().required(),
  lastName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s'-]+$/).trim().required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().max(128).required(),
  totpCode: Joi.string().length(6).pattern(/^\d+$/).optional()
});