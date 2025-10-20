import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useI18n } from './provider';

/**
 * Custom hook wrapper for useTranslation from react-i18next
 * Provides translations with additional language context
 *
 * @param namespace - Translation namespace (default: 'common')
 * @returns Translation function and language context
 *
 * @example
 * ```tsx
 * const { t, currentLanguage, changeLanguage } = useTranslation();
 *
 * return (
 *   <Text>{t('common:welcome')}</Text>
 * );
 * ```
 */
export function useTranslation(namespace: string | string[] = 'common') {
  const { t, i18n, ready } = useI18nextTranslation(namespace);
  const { currentLanguage, changeLanguage, isRTL, supportedLanguages } = useI18n();

  return {
    t,
    i18n,
    ready,
    currentLanguage,
    changeLanguage,
    isRTL,
    supportedLanguages,
  };
}

/**
 * Get translation function directly without hook
 * Useful for functions outside React components
 */
export { t } from 'i18next';
