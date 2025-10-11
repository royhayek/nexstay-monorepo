import { jwtDecode } from "jwt-decode";
import { authStorage } from "./storage";

// JWT payload interface
interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

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
   * Check if a token is expired
   * @param token - JWT token to check
   * @returns true if token is expired or invalid, false if still valid
   */
  isTokenExpired: (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded.exp) {
        return true; // No expiration means invalid token
      }
      // Add 5 second buffer to account for clock skew
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      return currentTime >= expirationTime - 5000;
    } catch (error) {
      // If token is malformed or can't be decoded, consider it expired
      return true;
    }
  },

  /**
   * Check if user is authenticated (has valid, non-expired access token)
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await authStorage.getAccessToken();
    if (!token) {
      return false;
    }

    // Validate token is not expired
    return !tokenManager.isTokenExpired(token);
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