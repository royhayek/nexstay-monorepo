import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  BIOMETRIC_ENABLED: "biometric_enabled",
} as const;

// Auth storage interface for better abstraction and testing
export interface AuthStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken?: string): Promise<void>;
  clearTokens(): Promise<void>;
  getUserData(): Promise<any>;
  setUserData(userData: any): Promise<void>;
  clearUserData(): Promise<void>;
  getBiometricEnabled(): Promise<boolean>;
  setBiometricEnabled(enabled: boolean): Promise<void>;
}

// AsyncStorage implementation
class AsyncStorageAuth implements AuthStorage {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const promises = [AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)];

      if (refreshToken) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error setting tokens:", error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.error("Error clearing tokens:", error);
      throw error;
    }
  }

  async getUserData(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error("Error setting user data:", error);
      throw error;
    }
  }

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Error clearing user data:", error);
      throw error;
    }
  }

  async getBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === "true";
    } catch (error) {
      console.error("Error getting biometric setting:", error);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
    } catch (error) {
      console.error("Error setting biometric setting:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const authStorage: AuthStorage = new AsyncStorageAuth();

// Export storage keys for reference
export { STORAGE_KEYS };