import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService as NestI18nService } from 'nestjs-i18n';

import {
  CurrencyFormat,
  TranslationArgs,
  TranslationNamespace,
  TranslationOptions,
} from './interfaces/i18n.interfaces';

@Injectable()
export class I18nService {
  constructor(
    private readonly nestI18nService: NestI18nService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Translate a key with optional arguments and language override
   */
  translate(key: string, options?: TranslationOptions): string {
    const lang = options?.lang || I18nContext.current()?.lang || this.getDefaultLanguage();

    try {
      return this.nestI18nService.translate(key, {
        lang,
        args: options?.args || {},
        defaultValue: options?.defaultValue,
      });
    } catch {
      // Fallback to default value or key if translation fails
      return options?.defaultValue || key;
    }
  }

  /**
   * Get translation for a specific language
   */
  translateFor(key: string, lang: string, args?: TranslationArgs): string {
    try {
      return this.nestI18nService.translate(key, { lang, args: args || {} });
    } catch {
      return key;
    }
  }

  /**
   * Get all translations for a specific namespace and language
   */
  async getTranslations(namespace: string, lang?: string): Promise<TranslationNamespace> {
    const language = lang || I18nContext.current()?.lang || this.getDefaultLanguage();

    try {
      return await this.nestI18nService.translate(namespace, { lang: language });
    } catch {
      return {};
    }
  }

  /**
   * Get the current language from context
   */
  getCurrentLanguage(): string {
    return I18nContext.current()?.lang || this.getDefaultLanguage();
  }

  /**
   * Get the default fallback language
   */
  getDefaultLanguage(): string {
    return this.configService.get<string>('i18n.fallbackLanguage', 'en');
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return this.configService.get<string[]>('i18n.supportedLanguages', ['en', 'fr', 'ar']);
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(lang: string): boolean {
    return this.getSupportedLanguages().includes(lang);
  }

  /**
   * Get language direction (LTR/RTL)
   */
  getLanguageDirection(lang?: string): 'ltr' | 'rtl' {
    const language = lang || this.getCurrentLanguage();
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ku', 'ps'];
    return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
  }

  /**
   * Get localized date format
   */
  getDateFormat(lang?: string): string {
    const language = lang || this.getCurrentLanguage();

    const formats: Record<string, string> = {
      en: 'MM/DD/YYYY',
      fr: 'DD/MM/YYYY',
      ar: 'DD/MM/YYYY',
    };

    return formats[language] || formats.en;
  }

  /**
   * Get localized currency format
   */
  getCurrencyFormat(lang?: string): CurrencyFormat {
    const language = lang || this.getCurrentLanguage();

    const formats: Record<string, CurrencyFormat> = {
      en: { currency: 'USD', locale: 'en-US' },
      fr: { currency: 'EUR', locale: 'fr-FR' },
      ar: { currency: 'USD', locale: 'ar-EG' },
    };

    return formats[language] || formats.en;
  }

  /**
   * Format a number according to locale
   */
  formatNumber(value: number, lang?: string): string {
    const language = lang || this.getCurrentLanguage();
    const { locale } = this.getCurrencyFormat(language);

    return new Intl.NumberFormat(locale).format(value);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, lang?: string): string {
    const language = lang || this.getCurrentLanguage();
    const { currency, locale } = this.getCurrencyFormat(language);

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, lang?: string): string {
    const language = lang || this.getCurrentLanguage();
    const { locale } = this.getCurrencyFormat(language);

    return new Intl.DateTimeFormat(locale).format(date);
  }
}
