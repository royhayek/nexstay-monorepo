// App-specific configuration
export const APP_CONFIG = {
  NAME: process.env.EXPO_PUBLIC_APP_NAME || "Homestay",
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || "development",

  // App behavior settings
  DEFAULT_LOCALE: "en",
  SUPPORTED_LOCALES: ["en", "es", "fr", "de", "zh"],

  // Feature flags
  DEBUG_MODE: process.env.EXPO_PUBLIC_ENABLE_DEBUG_MODE === "true",
  LOGGING_ENABLED: process.env.EXPO_PUBLIC_ENABLE_LOGGING === "true",
  ANALYTICS_ENABLED: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === "true",

  // Deep Linking
  APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME || "nexstay",

  // App Store/Play Store URLs
  IOS_APP_ID: "123456789", // Replace with actual App Store ID
  ANDROID_PACKAGE_NAME: "com.nexstay.app", // Replace with actual package name
} as const;

// Development environment check
export const isDevelopment = APP_CONFIG.ENVIRONMENT === "development";
export const isStaging = APP_CONFIG.ENVIRONMENT === "staging";
export const isProduction = APP_CONFIG.ENVIRONMENT === "production";
