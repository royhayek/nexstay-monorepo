import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import type { OAuthSignInDto } from '@/api/models/public';
import { authPublicControllerOauthSignIn } from '@/api/queries/public/authentication/authentication';
import type { SigninCompleteResponseDto } from '@/api/models/public';

/**
 * OAuth Service
 * Handles Google and Apple Sign-In flows and integrates with backend
 */
class OAuthService {
  private isGoogleConfigured = false;

  /**
   * Initialize Google Sign-In configuration
   * Must be called before using Google Sign-In
   */
  async configureGoogleSignIn() {
    if (this.isGoogleConfigured) return;

    try {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

      if (!webClientId) {
        console.warn('[OAuth] Google Client ID not configured in environment');
        return;
      }

      GoogleSignin.configure({
        webClientId, // Required for getting idToken
        offlineAccess: false, // We don't need refresh tokens from Google
        forceCodeForRefreshToken: false,
      });

      this.isGoogleConfigured = true;
      console.log('[OAuth] Google Sign-In configured successfully');
    } catch (error) {
      console.error('[OAuth] Failed to configure Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * Returns backend response with JWT tokens and user data
   */
  async signInWithGoogle(): Promise<SigninCompleteResponseDto> {
    try {
      // Ensure Google is configured
      await this.configureGoogleSignIn();

      // Check if Google Play Services are available (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Perform Google Sign-In
      const userInfo = await GoogleSignin.signIn();

      // Extract user information
      const { user, idToken } = userInfo;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      if (!user.email) {
        throw new Error('No email received from Google');
      }

      // Prepare OAuth data for backend
      const oauthData: OAuthSignInDto = {
        provider: 'google',
        accessToken: idToken, // Use idToken as access token
        email: user.email,
        providerId: user.id,
        firstName: user.givenName || undefined,
        lastName: user.familyName || undefined,
        photoUrl: user.photo || undefined,
      };

      // Send to backend and get JWT tokens
      const response = await authPublicControllerOauthSignIn(oauthData);

      console.log('[OAuth] Google sign-in successful');
      return response;
    } catch (error: any) {
      console.error('[OAuth] Google sign-in failed:', error);

      // Handle specific error cases
      if (error?.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Google sign-in was cancelled');
      } else if (error?.code === 'IN_PROGRESS') {
        throw new Error('Google sign-in already in progress');
      } else if (error?.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }

      throw error;
    }
  }

  /**
   * Sign in with Apple
   * Returns backend response with JWT tokens and user data
   * iOS only
   */
  async signInWithApple(): Promise<SigninCompleteResponseDto> {
    try {
      // Check if Apple Sign-In is available (iOS 13+)
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Perform Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract user information
      const { identityToken, email, fullName, user } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Apple may not provide email on subsequent sign-ins
      // Backend will handle this by looking up user by providerId
      const oauthData: OAuthSignInDto = {
        provider: 'apple',
        accessToken: identityToken,
        providerId: user,
        email: email || undefined,
        firstName: fullName?.givenName || undefined,
        lastName: fullName?.familyName || undefined,
      };

      // Send to backend and get JWT tokens
      const response = await authPublicControllerOauthSignIn(oauthData);

      console.log('[OAuth] Apple sign-in successful');
      return response;
    } catch (error: any) {
      console.error('[OAuth] Apple sign-in failed:', error);

      // Handle specific error cases
      if (error?.code === 'ERR_CANCELED') {
        throw new Error('Apple sign-in was cancelled');
      }

      throw error;
    }
  }

  /**
   * Sign out from Google
   * Clears Google Sign-In session
   */
  async signOutGoogle() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
        console.log('[OAuth] Google sign-out successful');
      }
    } catch (error) {
      console.error('[OAuth] Google sign-out failed:', error);
      // Don't throw - sign out from app should continue even if Google sign-out fails
    }
  }

  /**
   * Check if Apple Sign-In is available
   * iOS 13+ only
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('[OAuth] Failed to check Apple Sign-In availability:', error);
      return false;
    }
  }

  /**
   * Check if Google Sign-In is available
   * Android: requires Google Play Services
   * iOS: always available
   */
  async isGoogleSignInAvailable(): Promise<boolean> {
    try {
      await this.configureGoogleSignIn();

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
      }

      return true;
    } catch (error) {
      console.error('[OAuth] Google Sign-In not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
