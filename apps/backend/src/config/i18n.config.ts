import { registerAs } from '@nestjs/config';
import * as path from 'path';

export interface I18nConfig {
  fallbackLanguage: string;
  supportedLanguages: string[];
  translationsPath: string;
  loaderOptions: {
    path: string;
    watch: boolean;
  };
}

export default registerAs(
  'i18n',
  (): I18nConfig => ({
    fallbackLanguage: process.env.I18N_FALLBACK_LANGUAGE || 'en',
    supportedLanguages: (process.env.I18N_SUPPORTED_LANGUAGES || 'en,fr,ar').split(','),
    translationsPath: path.join(__dirname, '..', 'i18n'),
    loaderOptions: {
      path: path.join(__dirname, '..', 'i18n'),
      watch: process.env.NODE_ENV === 'development',
    },
  }),
);
