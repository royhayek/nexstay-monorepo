'use client';

import type {
  RequestResetDto,
  ResetPasswordDto,
  SigninInitiateResponseDto,
  SigninPasswordResponseDto,
  SigninCompleteResponseDto,
  VerifyResetResponseDto,
} from 'src/api/models/public';

import {
  authPublicControllerLogout,
  authPublicControllerRequestReset,
  authPublicControllerResetPassword,
  authPublicControllerSigninInitiate,
  authPublicControllerSigninPassword,
  authPublicControllerSigninVerifyDevice,
  authPublicControllerVerifyReset,
} from 'src/api/queries/public/authentication/authentication';

import { setSession } from './utils';

// ----------------------------------------------------------------------

/** **************************************
 * Step 1: Initiate Sign In
 * Start the unified sign-in flow with email/phone identifier
 *************************************** */
export const signinInitiate = async (identifier: string): Promise<SigninInitiateResponseDto> => {
  try {
    const res = await authPublicControllerSigninInitiate({
      identifier: identifier.trim(),
    });
    return res;
  } catch (error) {
    console.error('Error during signin initiate:', error);
    throw error;
  }
};

/** **************************************
 * Step 2: Sign In with Password
 * Complete sign-in with password or request SMS code
 *************************************** */
export const signinPassword = async (
  sessionToken: string,
  password: string,
  requestSmsCode?: boolean
): Promise<SigninPasswordResponseDto> => {
  try {
    const res = await authPublicControllerSigninPassword({
      sessionToken,
      password,
      requestSmsCode,
    });

    // Check if we got tokens (immediate success - no device verification needed)
    if (res.data.accessToken && res.data.refreshToken) {
      await setSession(res.data.accessToken, res.data.refreshToken);
    }

    return res;
  } catch (error) {
    console.error('Error during signin password:', error);
    throw error;
  }
};

/** **************************************
 * Step 3: Verify Device (if required)
 * Complete sign-in with device verification code
 *************************************** */
export const signinVerifyDevice = async (
  sessionToken: string,
  code: string
): Promise<SigninCompleteResponseDto> => {
  try {
    const res = await authPublicControllerSigninVerifyDevice({
      sessionToken,
      code,
    });

    const { accessToken, refreshToken } = res.data;

    if (!accessToken || !refreshToken) {
      throw new Error('Access or refresh token not found in response');
    }

    await setSession(accessToken, refreshToken);

    return res;
  } catch (error) {
    console.error('Error during signin verify device:', error);
    throw error;
  }
};

/** **************************************
 * Request Reset Password
 * Send password reset code to email or phone
 *************************************** */
export const requestResetPassword = async (params: RequestResetDto): Promise<void> => {
  try {
    await authPublicControllerRequestReset(params);
  } catch (error) {
    console.error('Error during password reset request:', error);
    throw error;
  }
};

/** **************************************
 * Verify Reset Code
 * Verify OTP code and get temporary reset token
 *************************************** */
export const verifyResetPassword = async (
  method: 'email' | 'phone',
  identifier: string,
  code: string
): Promise<VerifyResetResponseDto> => {
  try {
    const res = await authPublicControllerVerifyReset({
      method,
      identifier: identifier.trim(),
      code,
    });
    return res;
  } catch (error) {
    console.error('Error during reset password verification:', error);
    throw error;
  }
};

/** **************************************
 * Reset Password
 * Reset password using verification code and new password
 *************************************** */
export const resetPassword = async (params: ResetPasswordDto): Promise<void> => {
  try {
    await authPublicControllerResetPassword(params);
  } catch (error) {
    console.error('Error during password reset:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await authPublicControllerLogout();
    await setSession(null, null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
