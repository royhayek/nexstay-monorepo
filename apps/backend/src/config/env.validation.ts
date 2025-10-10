import * as Joi from 'joi';

export const envValidation = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),

  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),

  EMAIL_DISABLED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(process.env.NODE_ENV === 'test'),
  EMAIL_FROM: Joi.alternatives().conditional('EMAIL_DISABLED', {
    is: true,
    then: Joi.string().default('test@example.com'),
    otherwise: Joi.string().email().required(),
  }),
  EMAIL_HOST: Joi.string().when('EMAIL_DISABLED', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_PORT: Joi.number().port().default(587),
  EMAIL_USER: Joi.string().when('EMAIL_DISABLED', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_PASS: Joi.string().when('EMAIL_DISABLED', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),

  EMAIL_DKIM_DOMAIN: Joi.string().optional(),
  EMAIL_DKIM_SELECTOR: Joi.string().optional(),
  EMAIL_DKIM_PRIVATE_KEY: Joi.string().optional(),

  TWILIO_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),

  // AWS S3 Configuration
  AWS_S3_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET_NAME: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  AWS_S3_ENDPOINT: Joi.string().optional(), // For local testing with LocalStack
  AWS_S3_FORCE_PATH_STYLE: Joi.boolean().truthy('true').falsy('false').default(false),

  // File Upload Limits
  MAX_FILE_SIZE: Joi.number().default(10 * 1024 * 1024), // 10MB default
  MAX_PROFILE_IMAGE_SIZE: Joi.number().default(5 * 1024 * 1024), // 5MB for profile images
  MAX_PROPERTY_IMAGE_SIZE: Joi.number().default(10 * 1024 * 1024), // 10MB for property images

  // Image Processing
  ENABLE_IMAGE_PROCESSING: Joi.boolean().truthy('true').falsy('false').default(true),

  // I18n Configuration
  I18N_FALLBACK_LANGUAGE: Joi.string().valid('en', 'fr', 'ar').default('en'),
  I18N_SUPPORTED_LANGUAGES: Joi.string().default('en,fr,ar'),

  // Firebase Configuration
  FIREBASE_PROJECT_ID: Joi.string().optional(),
  FIREBASE_CREDENTIALS: Joi.string().optional(), // JSON string or base64 encoded service account

  // Payment Provider Configuration

  // APS (Amazon Payment Services)
  APS_MERCHANT_IDENTIFIER: Joi.string().optional(),
  APS_ACCESS_CODE: Joi.string().optional(),
  APS_SHA_REQUEST_PHRASE: Joi.string().optional(),
  APS_SHA_RESPONSE_PHRASE: Joi.string().optional(),
  APS_SANDBOX: Joi.boolean().truthy('true').falsy('false').default(true),
  APS_API_URL: Joi.string().optional(),

  // Payment Provider Enabled Flags
  PAYMENT_PROVIDER_APS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),

  // Message Encryption
  MESSAGE_ENCRYPTION_KEY: Joi.string()
    .min(32)
    .required()
    .description('Encryption key for message content (minimum 32 characters)'),
});
