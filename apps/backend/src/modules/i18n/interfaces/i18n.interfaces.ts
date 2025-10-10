/**
 * Translation interfaces for the I18n module
 */

/**
 * Arguments that can be passed to translation functions
 */
export interface TranslationArgs {
  [key: string]: string | number | boolean | Date;
}

/**
 * Options for translation methods
 */
export interface TranslationOptions {
  args?: TranslationArgs;
  defaultValue?: string;
  lang?: string;
}

/**
 * Language metadata information
 */
export interface LanguageInfo {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Currency format configuration
 */
export interface CurrencyFormat {
  currency: string;
  locale: string;
}

/**
 * Translation namespace structure
 */
export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace;
}

/**
 * API response for translation data
 */
export interface TranslationResponse {
  status: 'success' | 'error';
  data: {
    language: string;
    direction: 'ltr' | 'rtl';
    dateFormat?: string;
    currency?: CurrencyFormat;
    translations: Record<string, TranslationNamespace>;
  };
}

/**
 * API response for namespace translations
 */
export interface NamespaceTranslationResponse {
  status: 'success' | 'error';
  data: {
    namespace: string;
    language: string;
    translations: TranslationNamespace;
  };
}

/**
 * API response for supported languages
 */
export interface SupportedLanguagesResponse {
  status: 'success' | 'error';
  data: {
    current: string;
    default: string;
    supported: LanguageInfo[];
  };
}

/**
 * API response for key translation
 */
export interface KeyTranslationResponse {
  status: 'success' | 'error';
  data: {
    key: string;
    language: string;
    translation: string;
  };
}

/**
 * API response for language context
 */
export interface LanguageContextResponse {
  status: 'success' | 'error';
  data: {
    language: string;
    direction: 'ltr' | 'rtl';
    dateFormat: string;
    currency: CurrencyFormat;
    isSupported: boolean;
  };
}
