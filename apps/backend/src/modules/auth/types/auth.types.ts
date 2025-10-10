import { AuthMethod } from '../dto/login.dto';
import { RegistrationState } from '../../../database/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ValidateUserResult {
  isEmail: boolean;
  isValid: boolean;
}

export interface OtpConfigOptions {
  length: number;
  ttlMs: number;
  resendCooldownMs: number;
  maxAttempts: number;
  resetTtlMs: number;
  resetMaxAttempts: number;
  notifyEmailEnabled: boolean;
  notifySmsEnabled: boolean;
  windowRequests: number;
  windowMs: number;
}

export interface AuthServiceResponse<T = Record<string, unknown>> {
  message: string;
  data?: T;
}

export interface AuthError extends Error {
  code?: string;
  statusCode?: number;
}

export interface VerificationCodeResponse {
  success: boolean;
  testCode?: string;
}

export interface PasswordResetResponse {
  success: boolean;
}

export interface VerifyResetResponse {
  resetToken: string;
  expiresAt: string;
}

export interface VerifyResponse {
  ownershipVerified: boolean;
  verifiedIdentifier: string;
  accessToken?: string;
  refreshToken?: string;
  signupSessionToken?: string; // For signup flow when no user exists
}

export interface SignupInitiateResponse {
  success: boolean;
  testCode?: string;
  registrationState: string;
}

export interface SignupVerifyContactResponse {
  sessionToken: string;
  nextStep: string;
  registrationState: string;
}

export interface SignupCompleteResponse {
  accessToken: string;
  refreshToken: string;
  registrationState: RegistrationState;
}

export interface SignupSessionPayload {
  sub: string; // user ID
  type: 'signup_session';
  step: 'verified_contact' | 'profile_complete';
  identifier: string;
  method: 'email' | 'phone';
}

export interface ResetTokenPayload {
  sub: string; // user ID
  type: 'password_reset';
  iat?: number;
  exp?: number;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthRequest extends Request {
  user: {
    _id: string;
    email: string;
    roles: string[];
  };
}

export interface SigninInitiateResponse {
  userExists: boolean;
  sessionToken: string;
  nextStep: string;
  hasPassword?: boolean;
  testCode?: string;
}

export interface SigninPasswordResponse {
  requiresDeviceVerification: boolean;
  accessToken?: string;
  refreshToken?: string;
  sessionToken?: string;
  testCode?: string;
}

export interface SigninCompleteResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SigninSessionPayload {
  sub: string; // user ID or temp ID
  type: 'signin_session';
  step: 'initiated' | 'password_verified' | 'device_verification';
  identifier: string;
  method: 'email' | 'phone';
  deviceId?: string;
}

export type SupportedAuthMethod = AuthMethod.EMAIL | AuthMethod.PHONE;
