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
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

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

    // If a refresh is already in progress, wait for it instead of starting a new one
    if (refreshPromise) {
      console.info('Token refresh already in progress, waiting for completion...');
      try {
        await refreshPromise;
        console.info('Existing token refresh completed.');
      } catch (error) {
        console.error('Existing token refresh failed:', error);
      }
      return;
    }

    // Start the refresh process
    refreshPromise = (async () => {
      try {
        const storedRefreshToken = localStorage.getItem(JWT_REFRESH_STORAGE_KEY);
        const storedAccessToken = localStorage.getItem(JWT_STORAGE_KEY);

        console.info('Token expired, attempting to refresh tokens...');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

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
        console.error('Error during token expiration:', error);
        // Clear tokens and redirect to login on refresh failure
        localStorage.removeItem(JWT_STORAGE_KEY);
        localStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
        window.location.href = paths.auth.jwt.signIn;
        throw error;
      } finally {
        refreshPromise = null; // Clear the promise reference
      }
    })();

    await refreshPromise;
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
  // If a refresh is already in progress, return the same promise
  if (refreshPromise) {
    console.info('Token refresh already in progress, reusing existing promise...');
    return refreshPromise;
  }

  // Start a new refresh operation
  refreshPromise = (async () => {
    try {
      const storedRefreshToken = localStorage.getItem(JWT_REFRESH_STORAGE_KEY);
      const storedAccessToken = localStorage.getItem(JWT_STORAGE_KEY);

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
      localStorage.removeItem(JWT_STORAGE_KEY);
      localStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
      throw error;
    } finally {
      refreshPromise = null; // Clear the promise reference
    }
  })();

  return refreshPromise;
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null, refreshToken: string | null) {
  try {
    if (accessToken && refreshToken) {
      localStorage.setItem(JWT_STORAGE_KEY, accessToken);
      localStorage.setItem(JWT_REFRESH_STORAGE_KEY, refreshToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY);
      localStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
