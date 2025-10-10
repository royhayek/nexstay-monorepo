import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { DateUtils } from '../../common/utils/date.utils';
import { Observable, map } from 'rxjs';
import { I18nService } from '../../modules/i18n/i18n.service';
import { TRANSLATION_KEYS } from '../constants/translation-keys';
import { Response } from 'express';

export interface I18nResponseFormat<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  meta?: {
    language: string;
    direction: 'ltr' | 'rtl';
    timestamp: string;
  };
}

@Injectable()
export class I18nTransformInterceptor<T> implements NestInterceptor<T, I18nResponseFormat<T>> {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<I18nResponseFormat<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        const currentLang = this.i18nService.getCurrentLanguage();

        // Handle both direct data and already formatted responses
        let responseData = data;
        let message: string | undefined;
        let status: 'success' | 'error' = 'success';

        // If data is already formatted with status/data structure, extract it
        if (data && typeof data === 'object' && 'status' in data && 'data' in data) {
          const formattedData = data as {
            status: 'success' | 'error';
            data: unknown;
            message?: string;
          };
          status = formattedData.status;
          responseData = formattedData.data;
          message = formattedData.message;
        }

        // Try to translate message if it's a translation key
        if (message && this.isTranslationKey(message)) {
          message = this.i18nService.translate(message);
        }

        // Add i18n metadata
        const response: I18nResponseFormat<T> = {
          status,
          data: responseData as T,
          meta: {
            language: currentLang,
            direction: this.i18nService.getLanguageDirection(currentLang),
            timestamp: DateUtils.now().toISOString(),
          },
        };

        // Add message if present
        if (message) {
          response.message = message;
        }

        // Add language-specific headers
        const httpResponse = context.switchToHttp().getResponse<Response>();
        httpResponse.setHeader('Content-Language', currentLang);
        httpResponse.setHeader(
          'X-Language-Direction',
          this.i18nService.getLanguageDirection(currentLang),
        );

        return response;
      }),
    );
  }

  /**
   * Check if a string looks like a translation key
   */
  private isTranslationKey(str: string): boolean {
    // Simple heuristic: translation keys typically have dots and are in our constants
    return str.includes('.') && this.isKnownTranslationKey(str);
  }

  /**
   * Check if the key exists in our translation constants
   */
  private isKnownTranslationKey(key: string): boolean {
    // Flatten all translation keys for checking
    const allKeys = this.flattenTranslationKeys(TRANSLATION_KEYS);
    return allKeys.includes(key);
  }

  /**
   * Recursively flatten nested translation key objects
   */
  private flattenTranslationKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        keys.push(value);
      } else if (typeof value === 'object' && value !== null) {
        keys.push(
          ...this.flattenTranslationKeys(
            value as Record<string, unknown>,
            prefix ? `${prefix}.${key}` : key,
          ),
        );
      }
    }

    return keys;
  }
}
