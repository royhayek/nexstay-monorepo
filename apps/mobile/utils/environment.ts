import Constants from 'expo-constants';

export const isProduction = () => {
  const environment = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT ||
                     process.env.EXPO_PUBLIC_ENVIRONMENT ||
                     'development';

  return environment === 'production';
};

export const isDevelopment = () => {
  return !isProduction();
};

export const getEnvironment = () => {
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT ||
         process.env.EXPO_PUBLIC_ENVIRONMENT ||
         'development';
};