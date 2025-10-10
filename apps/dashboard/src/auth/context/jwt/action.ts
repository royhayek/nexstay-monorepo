'use client';

import type { LoginUserDto } from 'src/api/models';

import { authControllerLoginV1, authControllerLogoutV1 } from 'src/api/queries/auth/auth';

import { setSession } from './utils';

// ----------------------------------------------------------------------

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async (params: LoginUserDto): Promise<void> => {
  try {
    const res = await authControllerLoginV1(params);

    const { accessToken, refreshToken } = res.data;

    if (!accessToken || !refreshToken) {
      throw new Error('Access or refresh token not found in response');
    }

    setSession(accessToken, refreshToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await authControllerLogoutV1();
    await setSession(null, null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
