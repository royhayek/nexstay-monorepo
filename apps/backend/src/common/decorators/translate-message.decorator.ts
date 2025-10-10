import { applyDecorators, SetMetadata } from '@nestjs/common';

export const TRANSLATION_KEY_METADATA = 'translation_key';
export const TRANSLATION_ARGS_METADATA = 'translation_args';

/**
 * Decorator to mark a response message for translation
 * Usage: @TranslateMessage('auth.login.success')
 */
export const TranslateMessage = (key: string, args?: Record<string, any>) => {
  return applyDecorators(
    SetMetadata(TRANSLATION_KEY_METADATA, key),
    SetMetadata(TRANSLATION_ARGS_METADATA, args || {}),
  );
};

/**
 * Decorator for API success responses with translation
 */
export const ApiSuccessResponse = (translationKey: string, args?: Record<string, any>) => {
  return TranslateMessage(translationKey, args);
};

/**
 * Decorator for API error responses with translation
 */
export const ApiErrorResponse = (translationKey: string, args?: Record<string, any>) => {
  return TranslateMessage(translationKey, args);
};
