import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';
import { authPublicControllerRefresh } from 'src/api/queries/public/authentication/authentication';

import { JWT_STORAGE_KEY, JWT_REFRESH_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

let tokenRefreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;

export function tokenExpired(exp: number) {
  // Clear any existing timer to prevent multiple refresh attempts
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  tokenRefreshTimer = setTimeout(async () => {
    tokenRefreshTimer = null; // Clear the timer reference when it executes
    
    // Prevent concurrent refresh attempts
    if (isRefreshing) {
      console.info('Token refresh already in progress, skipping...');
      return;
    }
    
    isRefreshing = true;
    
    try {
      const storedRefreshToken = sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
      const storedAccessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      console.info('Token expired, attempting to refresh tokens...');
      if (storedRefreshToken) {
        // Include the current access token in the Authorization header for the refresh request
        const requestOptions = storedAccessToken
          ? {
              headers: {
                Authorization: `Bearer ${storedAccessToken}`,
              },
            }
          : undefined;

        const res = await authPublicControllerRefresh(
          { refreshToken: storedRefreshToken },
          requestOptions
        );
        const { accessToken, refreshToken } = res.data;
        await setSession(accessToken, refreshToken);
        console.info('Tokens refreshed successfully.');
        return;
      }

      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      // Clear tokens and redirect to login on refresh failure
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } finally {
      isRefreshing = false; // Always reset the flag
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function refreshAccessToken() {
  // Prevent concurrent refresh attempts
  if (isRefreshing) {
    console.info('Token refresh already in progress, waiting...');
    // Wait a bit and return if still refreshing
    await new Promise(resolve => setTimeout(resolve, 100));
    if (isRefreshing) {
      throw new Error('Token refresh in progress');
    }
  }
  
  isRefreshing = true;
  
  try {
    const storedRefreshToken = sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
    const storedAccessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    console.info('Manually refreshing tokens...');

    // Include the current access token in the Authorization header for the refresh request
    const requestOptions = storedAccessToken
      ? {
          headers: {
            Authorization: `Bearer ${storedAccessToken}`,
          },
        }
      : undefined;

    const res = await authPublicControllerRefresh(
      { refreshToken: storedRefreshToken },
      requestOptions
    );

    const { accessToken, refreshToken } = res.data;
    await setSession(accessToken, refreshToken);
    console.info('Tokens refreshed successfully.');

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error during manual token refresh:', error);
    // Clear tokens and redirect to login on refresh failure
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
    window.location.href = paths.auth.jwt.signIn;
    throw error;
  } finally {
    isRefreshing = false; // Always reset the flag
  }
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null, refreshToken: string | null) {
  try {
    if (accessToken && refreshToken) {
      sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
      sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, refreshToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken); // ~3 days by minimals server

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
