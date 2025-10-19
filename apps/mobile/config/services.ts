// Third-party services configuration
export const SERVICES_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || "https://api.nexstay.com/api/v1",
    TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10),
    VERSION: process.env.EXPO_PUBLIC_API_VERSION || "v1",
  },

  // Google Maps
  GOOGLE_MAPS: {
    API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    DEFAULT_REGION: {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
  },

  // Firebase
  FIREBASE: {
    API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },

  // Stripe
  STRIPE: {
    PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    MERCHANT_ID: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID,
  },

  // Error Tracking & Monitoring
  SENTRY: {
    DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    DEBUG: process.env.EXPO_PUBLIC_ENVIRONMENT === "development",
    SAMPLE_RATE: process.env.EXPO_PUBLIC_ENVIRONMENT === "production" ? 0.1 : 1.0,
  },

  // Analytics
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: process.env.EXPO_PUBLIC_GA_TRACKING_ID,
    MIXPANEL_TOKEN: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
    AMPLITUDE_API_KEY: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
  },

  // Storage & CDN
  STORAGE: {
    AWS_S3_BUCKET: process.env.EXPO_PUBLIC_AWS_S3_BUCKET,
    AWS_REGION: process.env.EXPO_PUBLIC_AWS_REGION || "us-east-1",
    CDN_URL: process.env.EXPO_PUBLIC_CDN_URL,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
    ALLOWED_DOCUMENT_TYPES: ["application/pdf", "application/msword"],
  },

  // Social Authentication
  SOCIAL_AUTH: {
    GOOGLE: {
      CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
    FACEBOOK: {
      APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
      APP_NAME: process.env.EXPO_PUBLIC_FACEBOOK_APP_NAME,
    },
    APPLE: {
      CLIENT_ID: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID,
    },
  },

  // Push Notifications
  PUSH_NOTIFICATIONS: {
    EXPO_PUSH_TOKEN: process.env.EXPO_PUBLIC_PUSH_TOKEN,
    FCM_SENDER_ID: process.env.EXPO_PUBLIC_FCM_SENDER_ID,
  },

  // Location Services
  LOCATION: {
    DEFAULT_RADIUS: 5000, // meters
    MAX_RADIUS: 50000, // 50km
    GEOCODING_PROVIDER: "google", // or "native"
  },
} as const;

// Service availability checks
export const isServiceAvailable = {
  googleMaps: !!SERVICES_CONFIG.GOOGLE_MAPS.API_KEY,
  firebase: !!SERVICES_CONFIG.FIREBASE.PROJECT_ID,
  stripe: !!SERVICES_CONFIG.STRIPE.PUBLISHABLE_KEY,
  sentry: !!SERVICES_CONFIG.SENTRY.DSN,
  googleAuth: !!SERVICES_CONFIG.SOCIAL_AUTH.GOOGLE.CLIENT_ID,
  facebookAuth: !!SERVICES_CONFIG.SOCIAL_AUTH.FACEBOOK.APP_ID,
} as const;
