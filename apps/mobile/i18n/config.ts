import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the API function for fetching translations
import { i18nPublicControllerGetAllTranslations } from '@/api/queries/public/internationalization-public/internationalization-public';

const LANGUAGE_STORAGE_KEY = '@nexstay:language';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Get the default language based on device locale or fallback to English
 */
export const getDefaultLanguage = async (): Promise<LanguageCode> => {
  try {
    // Check if user has previously selected a language
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && SUPPORTED_LANGUAGES.some((lang) => lang.code === storedLanguage)) {
      return storedLanguage as LanguageCode;
    }

    // Get device locale
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    const matchedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === deviceLocale);

    return matchedLanguage ? matchedLanguage.code : 'en';
  } catch (error) {
    console.error('Error getting default language:', error);
    return 'en';
  }
};

/**
 * Save selected language to storage
 */
export const saveLanguagePreference = async (language: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

/**
 * Load translations from backend for a specific language
 */
const loadTranslationsFromBackend = async (language: LanguageCode) => {
  try {
    const response = await i18nPublicControllerGetAllTranslations({ lang: language });
    return response.data || {};
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    // Return empty object on error - i18next will use fallback language
    return {};
  }
};

/**
 * Initialize i18next with configuration
 */
export const initializeI18n = async () => {
  const defaultLanguage = await getDefaultLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3', // Important for React Native
      lng: defaultLanguage,
      fallbackLng: 'en',
      debug: __DEV__,

      // Namespace configuration
      defaultNS: 'common',
      ns: ['common', 'auth', 'storage'],

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      react: {
        useSuspense: false, // Important for React Native
      },

      // Resources will be loaded dynamically
      resources: {},
    });

  // Load initial translations for the default language
  await loadLanguageResources(defaultLanguage);

  return i18n;
};

/**
 * Load all translation resources for a specific language
 */
export const loadLanguageResources = async (language: LanguageCode) => {
  try {
    console.log(`Loading translations for language: ${language}`);

    const translations = await loadTranslationsFromBackend(language);

    // Add translations to i18next
    Object.keys(translations).forEach((namespace) => {
      i18n.addResourceBundle(language, namespace, translations[namespace], true, true);
    });

    console.log(`Successfully loaded translations for ${language}`);
    return true;
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    return false;
  }
};

/**
 * Change the current language
 */
export const changeLanguage = async (language: LanguageCode) => {
  try {
    // Check if translations are already loaded
    const hasResources = i18n.hasResourceBundle(language, 'common');

    if (!hasResources) {
      // Load translations first
      await loadLanguageResources(language);
    }

    // Change language
    await i18n.changeLanguage(language);

    // Save preference
    await saveLanguagePreference(language);

    // Set RTL for Arabic
    const isRTL = SUPPORTED_LANGUAGES.find((lang) => lang.code === language)?.isRTL || false;
    // Note: RTL will be handled by the RTL manager in the app

    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

/**
 * Get current language info
 */
export const getCurrentLanguageInfo = () => {
  const currentLang = i18n.language;
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLang) || SUPPORTED_LANGUAGES[0];
};

/**
 * Check if current language is RTL
 */
export const isRTL = () => {
  return getCurrentLanguageInfo().isRTL || false;
};

export default i18n;
