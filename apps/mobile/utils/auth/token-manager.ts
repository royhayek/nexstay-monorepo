import { authStorage } from "./storage";

// Token management utilities
export const tokenManager = {
  /**
   * Get the current access token
   */
  getAccessToken: async (): Promise<string | null> => {
    return authStorage.getAccessToken();
  },

  /**
   * Get the current refresh token
   */
  getRefreshToken: async (): Promise<string | null> => {
    return authStorage.getRefreshToken();
  },

  /**
   * Set both access and refresh tokens
   */
  setTokens: async (accessToken: string, refreshToken?: string): Promise<void> => {
    return authStorage.setTokens(accessToken, refreshToken);
  },

  /**
   * Clear all authentication tokens
   */
  clearTokens: async (): Promise<void> => {
    return authStorage.clearTokens();
  },

  /**
   * Check if user is authenticated (has valid access token)
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await authStorage.getAccessToken();
    return !!token;
  },

  /**
   * Check if refresh token exists
   */
  hasRefreshToken: async (): Promise<boolean> => {
    const refreshToken = await authStorage.getRefreshToken();
    return !!refreshToken;
  },

  /**
   * Get token for Authorization header
   */
  getAuthHeader: async (): Promise<string | null> => {
    const token = await authStorage.getAccessToken();
    return token ? `Bearer ${token}` : null;
  },
};

// User data management
export const userManager = {
  /**
   * Get stored user data
   */
  getUserData: async (): Promise<any> => {
    return authStorage.getUserData();
  },

  /**
   * Set user data
   */
  setUserData: async (userData: any): Promise<void> => {
    return authStorage.setUserData(userData);
  },

  /**
   * Clear user data
   */
  clearUserData: async (): Promise<void> => {
    return authStorage.clearUserData();
  },

  /**
   * Update specific user data fields
   */
  updateUserData: async (updates: Partial<any>): Promise<void> => {
    const currentData = await authStorage.getUserData();
    const updatedData = { ...currentData, ...updates };
    return authStorage.setUserData(updatedData);
  },
};

// Settings management
export const settingsManager = {
  /**
   * Get biometric authentication setting
   */
  getBiometricEnabled: async (): Promise<boolean> => {
    return authStorage.getBiometricEnabled();
  },

  /**
   * Set biometric authentication setting
   */
  setBiometricEnabled: async (enabled: boolean): Promise<void> => {
    return authStorage.setBiometricEnabled(enabled);
  },
};

// Full logout utility
export const logout = async (): Promise<void> => {
  await Promise.all([
    tokenManager.clearTokens(),
    userManager.clearUserData(),
  ]);
};