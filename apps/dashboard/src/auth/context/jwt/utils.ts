import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';
import { authControllerRefreshV1 } from 'src/api/queries/auth/auth';

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

export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  setTimeout(async () => {
    try {
      const storedRefreshToken = sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);

      console.info('Token expired, attempting to refresh tokens...');
      if (storedRefreshToken) {
        const res = await authControllerRefreshV1({ refreshToken: storedRefreshToken });
        const { accessToken, refreshToken } = res.data;
        await setSession(accessToken, refreshToken);
        console.info('Tokens refreshed successfully.');
        return;
      }

      sessionStorage.removeItem(JWT_STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
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
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
