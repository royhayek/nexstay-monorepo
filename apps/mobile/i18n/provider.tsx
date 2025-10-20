import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { I18nManager, Alert } from 'react-native';
import { I18nextProvider } from 'react-i18next';

import i18n, {
  initializeI18n,
  changeLanguage as changeI18nLanguage,
  getCurrentLanguageInfo,
  isRTL as checkIsRTL,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from './config';

interface I18nContextValue {
  currentLanguage: LanguageCode;
  changeLanguage: (language: LanguageCode) => Promise<void>;
  isRTL: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  isInitialized: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [isRTL, setIsRTL] = useState(false);

  // Initialize i18n on mount
  useEffect(() => {
    initializeI18n()
      .then(() => {
        const langInfo = getCurrentLanguageInfo();
        setCurrentLanguage(langInfo.code);
        setIsRTL(langInfo.isRTL || false);
        setIsInitialized(true);

        // Set RTL layout if needed
        if (langInfo.isRTL !== I18nManager.isRTL) {
          I18nManager.forceRTL(langInfo.isRTL || false);
        }
      })
      .catch((error) => {
        console.error('Failed to initialize i18n:', error);
        // Even on error, mark as initialized with fallback language
        setIsInitialized(true);
      });
  }, []);

  const handleLanguageChange = async (language: LanguageCode) => {
    try {
      const success = await changeI18nLanguage(language);

      if (success) {
        const langInfo = getCurrentLanguageInfo();
        setCurrentLanguage(langInfo.code);
        const newIsRTL = langInfo.isRTL || false;

        // Check if RTL direction changed
        if (newIsRTL !== I18nManager.isRTL) {
          // RTL direction changed - need to reload app
          setIsRTL(newIsRTL);
          I18nManager.forceRTL(newIsRTL);

          // Show alert to user about app reload requirement
          Alert.alert(
            'Language Changed',
            'The app needs to reload to apply the new language direction. Please restart the app.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('RTL direction change requires app restart');
                },
              },
            ]
          );
        } else {
          setIsRTL(newIsRTL);
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const contextValue: I18nContextValue = {
    currentLanguage,
    changeLanguage: handleLanguageChange,
    isRTL,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isInitialized,
  };

  if (!isInitialized) {
    // You could show a loading indicator here
    return null;
  }

  return (
    <I18nContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
}

/**
 * Hook to access i18n context
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/**
 * Hook to check if current language is RTL
 */
export function useIsRTL() {
  const { isRTL } = useI18n();
  return isRTL;
}
