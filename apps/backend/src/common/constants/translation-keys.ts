/**
 * Translation keys constants for type safety and consistent usage
 * These keys correspond to the JSON translation files
 */

export const TRANSLATION_KEYS = {
  // Common translations
  COMMON: {
    SUCCESS: 'common.success',
    ERROR: 'common.error',
    VALIDATION: {
      REQUIRED: 'common.validation.required',
      EMAIL: 'common.validation.email',
      PASSWORD: 'common.validation.password',
      PHONE: 'common.validation.phone',
      MIN_LENGTH: 'common.validation.minLength',
      MAX_LENGTH: 'common.validation.maxLength',
      MIN: 'common.validation.min',
      MAX: 'common.validation.max',
      IS_STRING: 'common.validation.isString',
      IS_NUMBER: 'common.validation.isNumber',
      IS_BOOLEAN: 'common.validation.isBoolean',
      IS_ARRAY: 'common.validation.isArray',
      IS_ENUM: 'common.validation.isEnum',
    },
    MESSAGES: {
      NOT_FOUND: 'common.messages.notFound',
      UNAUTHORIZED: 'common.messages.unauthorized',
      FORBIDDEN: 'common.messages.forbidden',
      BAD_REQUEST: 'common.messages.badRequest',
      INTERNAL_ERROR: 'common.messages.internalError',
      CONFLICT: 'common.messages.conflict',
      TOO_MANY_REQUESTS: 'common.messages.tooManyRequests',
    },
    ACTIONS: {
      CREATE: 'common.actions.create',
      READ: 'common.actions.read',
      UPDATE: 'common.actions.update',
      DELETE: 'common.actions.delete',
      UPLOAD: 'common.actions.upload',
      DOWNLOAD: 'common.actions.download',
      SUBMIT: 'common.actions.submit',
      CANCEL: 'common.actions.cancel',
      SAVE: 'common.actions.save',
      EDIT: 'common.actions.edit',
      VIEW: 'common.actions.view',
      SEARCH: 'common.actions.search',
      FILTER: 'common.actions.filter',
      SORT: 'common.actions.sort',
      REFRESH: 'common.actions.refresh',
      BACK: 'common.actions.back',
      NEXT: 'common.actions.next',
      PREVIOUS: 'common.actions.previous',
      CLOSE: 'common.actions.close',
    },
    STATUS: {
      ACTIVE: 'common.status.active',
      INACTIVE: 'common.status.inactive',
      PENDING: 'common.status.pending',
      APPROVED: 'common.status.approved',
      REJECTED: 'common.status.rejected',
      COMPLETED: 'common.status.completed',
      CANCELLED: 'common.status.cancelled',
      PROCESSING: 'common.status.processing',
    },
    TIME: {
      NOW: 'common.time.now',
      TODAY: 'common.time.today',
      YESTERDAY: 'common.time.yesterday',
      TOMORROW: 'common.time.tomorrow',
      THIS_WEEK: 'common.time.thisWeek',
      LAST_WEEK: 'common.time.lastWeek',
      THIS_MONTH: 'common.time.thisMonth',
      LAST_MONTH: 'common.time.lastMonth',
      THIS_YEAR: 'common.time.thisYear',
      LAST_YEAR: 'common.time.lastYear',
    },
  },

  // Authentication translations
  AUTH: {
    LOGIN: {
      TITLE: 'auth.login.title',
      SUBTITLE: 'auth.login.subtitle',
      SUCCESS: 'auth.login.success',
      FAILED: 'auth.login.failed',
      BLOCKED: 'auth.login.blocked',
    },
    REGISTER: {
      TITLE: 'auth.register.title',
      SUBTITLE: 'auth.register.subtitle',
      SUCCESS: 'auth.register.success',
      EMAIL_EXISTS: 'auth.register.emailExists',
      PHONE_EXISTS: 'auth.register.phoneExists',
    },
    VERIFICATION: {
      TITLE: 'auth.verification.title',
      SUBTITLE: 'auth.verification.subtitle',
      SUCCESS: 'auth.verification.success',
      CODE_INVALID: 'auth.verification.codeInvalid',
      CODE_EXPIRED: 'auth.verification.codeExpired',
      CODE_SENT: 'auth.verification.codeSent',
      TOO_MANY_REQUESTS: 'auth.verification.tooManyRequests',
    },
    PASSWORD: {
      RESET: {
        TITLE: 'auth.password.reset.title',
        SUBTITLE: 'auth.password.reset.subtitle',
        SUCCESS: 'auth.password.reset.success',
        CODE_SENT: 'auth.password.reset.codeSent',
        CODE_INVALID: 'auth.password.reset.codeInvalid',
        CODE_EXPIRED: 'auth.password.reset.codeExpired',
      },
      CHANGE: {
        TITLE: 'auth.password.change.title',
        SUCCESS: 'auth.password.change.success',
        CURRENT_INVALID: 'auth.password.change.currentInvalid',
      },
    },
    LOGOUT: {
      SUCCESS: 'auth.logout.success',
      TITLE: 'auth.logout.title',
    },
    PROFILE: {
      TITLE: 'auth.profile.title',
      UPDATE_SUCCESS: 'auth.profile.updateSuccess',
      AVATAR_UPLOAD_SUCCESS: 'auth.profile.avatarUploadSuccess',
      AVATAR_DELETE_SUCCESS: 'auth.profile.avatarDeleteSuccess',
    },
    TOKENS: {
      REFRESH_SUCCESS: 'auth.tokens.refreshSuccess',
      REFRESH_FAILED: 'auth.tokens.refreshFailed',
      EXPIRED: 'auth.tokens.expired',
      INVALID: 'auth.tokens.invalid',
    },
    FIELDS: {
      EMAIL: 'auth.fields.email',
      PHONE: 'auth.fields.phone',
      PASSWORD: 'auth.fields.password',
      CONFIRM_PASSWORD: 'auth.fields.confirmPassword',
      CURRENT_PASSWORD: 'auth.fields.currentPassword',
      NEW_PASSWORD: 'auth.fields.newPassword',
      FIRST_NAME: 'auth.fields.firstName',
      LAST_NAME: 'auth.fields.lastName',
      FULL_NAME: 'auth.fields.fullName',
      IDENTIFIER: 'auth.fields.identifier',
      VERIFICATION_CODE: 'auth.fields.verificationCode',
      RESET_CODE: 'auth.fields.resetCode',
    },
    ROLES: {
      ADMIN: 'auth.roles.admin',
      HOST: 'auth.roles.host',
      GUEST: 'auth.roles.guest',
    },
  },

  // Storage/File upload translations
  STORAGE: {
    UPLOAD: {
      SUCCESS: 'storage.upload.success',
      FAILED: 'storage.upload.failed',
      INVALID_FILE_TYPE: 'storage.upload.invalidFileType',
      FILE_TOO_LARGE: 'storage.upload.fileTooLarge',
      PROCESSING: 'storage.upload.processing',
    },
    DELETE: {
      SUCCESS: 'storage.delete.success',
      FAILED: 'storage.delete.failed',
      NOT_FOUND: 'storage.delete.notFound',
    },
    ERRORS: {
      FILE_NOT_FOUND: 'storage.errors.fileNotFound',
      UNAUTHORIZED_ACCESS: 'storage.errors.unauthorizedAccess',
      INVALID_KEY: 'storage.errors.invalidKey',
    },
  },
} as const;

// Type for translation key paths (for type safety)
export type TranslationKey =
  | (typeof TRANSLATION_KEYS.COMMON)[keyof typeof TRANSLATION_KEYS.COMMON]
  | (typeof TRANSLATION_KEYS.COMMON.VALIDATION)[keyof typeof TRANSLATION_KEYS.COMMON.VALIDATION]
  | (typeof TRANSLATION_KEYS.COMMON.MESSAGES)[keyof typeof TRANSLATION_KEYS.COMMON.MESSAGES]
  | (typeof TRANSLATION_KEYS.COMMON.ACTIONS)[keyof typeof TRANSLATION_KEYS.COMMON.ACTIONS]
  | (typeof TRANSLATION_KEYS.COMMON.STATUS)[keyof typeof TRANSLATION_KEYS.COMMON.STATUS]
  | (typeof TRANSLATION_KEYS.COMMON.TIME)[keyof typeof TRANSLATION_KEYS.COMMON.TIME]
  | (typeof TRANSLATION_KEYS.AUTH.LOGIN)[keyof typeof TRANSLATION_KEYS.AUTH.LOGIN]
  | (typeof TRANSLATION_KEYS.AUTH.REGISTER)[keyof typeof TRANSLATION_KEYS.AUTH.REGISTER]
  | (typeof TRANSLATION_KEYS.AUTH.VERIFICATION)[keyof typeof TRANSLATION_KEYS.AUTH.VERIFICATION]
  | (typeof TRANSLATION_KEYS.AUTH.PASSWORD.RESET)[keyof typeof TRANSLATION_KEYS.AUTH.PASSWORD.RESET]
  | (typeof TRANSLATION_KEYS.AUTH.PASSWORD.CHANGE)[keyof typeof TRANSLATION_KEYS.AUTH.PASSWORD.CHANGE]
  | (typeof TRANSLATION_KEYS.AUTH.LOGOUT)[keyof typeof TRANSLATION_KEYS.AUTH.LOGOUT]
  | (typeof TRANSLATION_KEYS.AUTH.PROFILE)[keyof typeof TRANSLATION_KEYS.AUTH.PROFILE]
  | (typeof TRANSLATION_KEYS.AUTH.TOKENS)[keyof typeof TRANSLATION_KEYS.AUTH.TOKENS]
  | (typeof TRANSLATION_KEYS.AUTH.FIELDS)[keyof typeof TRANSLATION_KEYS.AUTH.FIELDS]
  | (typeof TRANSLATION_KEYS.AUTH.ROLES)[keyof typeof TRANSLATION_KEYS.AUTH.ROLES]
  | (typeof TRANSLATION_KEYS.STORAGE.UPLOAD)[keyof typeof TRANSLATION_KEYS.STORAGE.UPLOAD]
  | (typeof TRANSLATION_KEYS.STORAGE.DELETE)[keyof typeof TRANSLATION_KEYS.STORAGE.DELETE]
  | (typeof TRANSLATION_KEYS.STORAGE.ERRORS)[keyof typeof TRANSLATION_KEYS.STORAGE.ERRORS];
