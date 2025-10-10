import type {
  AddSecondaryContactResponseDto,
  CheckIdentifierResponseDto,
  RequestResetResponseDto,
  RequestVerifyResponseDto,
  ResetPasswordResponseDto,
  SigninCompleteResponseDto,
  SigninInitiateResponseDto,
  SigninPasswordResponseDto,
  SignupCompleteProfileDto,
  SignupCompleteResponseDto,
  SignupInitiateResponseDto,
  UserDataDto,
  VerifyResetResponseDto,
  VerifyResponseDto,
} from "@/api/models/public";
import {
  useAuthPublicControllerAddSecondaryContact,
  useAuthPublicControllerCheckIdentifier,
  useAuthPublicControllerRequestReset,
  useAuthPublicControllerRequestVerify,
  useAuthPublicControllerResetPassword,
  useAuthPublicControllerSigninInitiate,
  useAuthPublicControllerSigninPassword,
  useAuthPublicControllerSigninVerifyDevice,
  useAuthPublicControllerSignupCompleteProfile,
  useAuthPublicControllerSignupVerifyContact,
  useAuthPublicControllerVerify,
  useAuthPublicControllerVerifyReset,
} from "@/api/queries/public/authentication/authentication";
import { usersAppControllerGetProfile } from "@/api/queries/protected/users/users";
import { logout, tokenManager, userManager } from "@/utils/auth";
import { isDevelopment } from "@/utils/environment";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

// Use generated API response types directly

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDataDto | null;
  showLoginModal: boolean;
  login: (tokens: { accessToken: string; refreshToken?: string }, userData?: UserDataDto) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserDataDto>) => Promise<void>;
  setShowLoginModal: (show: boolean) => void;

  // Step 1: Check Identifier
  checkIdentifier: (identifier: string) => Promise<CheckIdentifierResponseDto>;

  // Signup Flow
  signupVerifyContact: (identifier: string) => Promise<SignupInitiateResponseDto>;
  verify: (method: "email" | "phone", identifier: string, code: string) => Promise<VerifyResponseDto>;
  completeProfile: (profileData: SignupCompleteProfileDto) => Promise<SignupCompleteResponseDto>;

  // Signin Flow
  signinInitiate: (identifier: string) => Promise<SigninInitiateResponseDto>;
  signinPassword: (
    sessionToken: string,
    password: string,
    requestSmsCode?: boolean
  ) => Promise<SigninPasswordResponseDto>;
  signinVerifyDevice: (sessionToken: string, code: string) => Promise<SigninCompleteResponseDto>;

  // Password Reset Flow
  requestReset: (method: "email" | "phone", identifier: string) => Promise<RequestResetResponseDto>;
  verifyReset: (method: "email" | "phone", identifier: string, code: string) => Promise<VerifyResetResponseDto>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<ResetPasswordResponseDto>;

  // Add Secondary Contact (Post-Registration)
  addSecondaryContact: (contactType: "email" | "phone", contact: string) => Promise<AddSecondaryContactResponseDto>;

  // Request Verification Code (General)
  requestVerify: (method: "email" | "phone", identifier: string) => Promise<RequestVerifyResponseDto>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDataDto | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Generated API hooks
  const checkIdentifierMutation = useAuthPublicControllerCheckIdentifier();
  const signupVerifyContactMutation = useAuthPublicControllerSignupVerifyContact();
  const verifyMutation = useAuthPublicControllerVerify();
  const completeProfileMutation = useAuthPublicControllerSignupCompleteProfile();
  const signinInitiateMutation = useAuthPublicControllerSigninInitiate();
  const signinPasswordMutation = useAuthPublicControllerSigninPassword();
  const signinVerifyDeviceMutation = useAuthPublicControllerSigninVerifyDevice();
  const requestResetMutation = useAuthPublicControllerRequestReset();
  const verifyResetMutation = useAuthPublicControllerVerifyReset();
  const resetPasswordMutation = useAuthPublicControllerResetPassword();
  const addSecondaryContactMutation = useAuthPublicControllerAddSecondaryContact();
  const requestVerifyMutation = useAuthPublicControllerRequestVerify();

  // Helper function to fetch user profile after login
  const fetchUserProfile = async (): Promise<UserDataDto | null> => {
    try {
      const response = await usersAppControllerGetProfile();
      if (response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  };

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authenticated = await tokenManager.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userData = await userManager.getUserData();
        setUser(userData);
        setShowLoginModal(false);
      } else {
        setShowLoginModal(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      setShowLoginModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (tokens: { accessToken: string; refreshToken?: string }, userData?: UserDataDto) => {
    try {
      await tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);

      if (userData) {
        await userManager.setUserData(userData);
        setUser(userData);
      }

      setIsAuthenticated(true);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUser(null);
      setShowLoginModal(true);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<UserDataDto>) => {
    try {
      await userManager.updateUserData(userData);
      const updatedUser = await userManager.getUserData();
      setUser(updatedUser);
    } catch (error) {
      console.error("Update user failed:", error);
      throw error;
    }
  };

  // New authentication flow methods
  const checkIdentifier = async (identifier: string): Promise<CheckIdentifierResponseDto> => {
    try {
      const response = await checkIdentifierMutation.mutateAsync({
        data: { identifier: identifier.trim() },
      });
      return response;
    } catch (error) {
      console.error("Check identifier failed:", error);
      throw error;
    }
  };

  const signupVerifyContact = async (identifier: string): Promise<SignupInitiateResponseDto> => {
    try {
      const response = await signupVerifyContactMutation.mutateAsync({
        data: { identifier: identifier.trim() },
      });

      // Show test code in development
      if (isDevelopment() && response.data.testCode) {
        Alert.alert(
          "Test Code (Dev Only)",
          `Verification code: ${response.data.testCode}\n\nCopy this code to verify your contact.`,
          [{ text: "OK" }]
        );
      }

      return response;
    } catch (error) {
      console.error("Signup verify contact failed:", error);
      throw error;
    }
  };

  const verify = async (method: "email" | "phone", identifier: string, code: string): Promise<VerifyResponseDto> => {
    try {
      const response = await verifyMutation.mutateAsync({
        data: { method, identifier: identifier.trim(), code },
      });
      return response;
    } catch (error) {
      console.error("Verify code failed:", error);
      throw error;
    }
  };

  const completeProfile = async (profileData: SignupCompleteProfileDto): Promise<SignupCompleteResponseDto> => {
    try {
      const response = await completeProfileMutation.mutateAsync({
        data: profileData,
      });

      // Auto-login with received tokens
      const tokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };

      // First save tokens
      await tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);

      // Then fetch user profile
      const userData = await fetchUserProfile();

      // Complete login with user data
      await login(tokens, userData || undefined);

      return response;
    } catch (error) {
      console.error("Complete profile failed:", error);
      throw error;
    }
  };

  const signinInitiate = async (identifier: string): Promise<SigninInitiateResponseDto> => {
    try {
      const response = await signinInitiateMutation.mutateAsync({
        data: { identifier: identifier.trim() },
      });

      // Show test code for SMS verification in development
      if (isDevelopment() && response.data.testCode && response.data.nextStep === "sms_code") {
        Alert.alert(
          "Test Code (Dev Only)",
          `SMS verification code: ${response.data.testCode}\n\nCopy this code to sign in.`,
          [{ text: "OK" }]
        );
      }

      return response;
    } catch (error) {
      console.error("Signin initiate failed:", error);
      throw error;
    }
  };

  const signinPassword = async (
    sessionToken: string,
    password: string,
    requestSmsCode?: boolean
  ): Promise<SigninPasswordResponseDto> => {
    try {
      const response = await signinPasswordMutation.mutateAsync({
        data: { sessionToken, password, requestSmsCode },
      });

      // Check if we got tokens (immediate success)
      if (response.data.accessToken) {
        const tokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };

        // Use user data directly if available
        const userData = response.data.user ? response.data.user : undefined;

        // Auto-login with tokens and user data
        await login(tokens, userData);
      }

      // Check if device verification is required and show test code in development
      if (isDevelopment() && response.data.requiresDeviceVerification && response.data.testCode) {
        Alert.alert(
          "Test Code (Dev Only)",
          `Device verification code: ${response.data.testCode}\n\nCopy this code to complete device verification.`,
          [{ text: "OK" }]
        );
      }

      return response;
    } catch (error) {
      console.error("Signin password failed:", error);
      throw error;
    }
  };

  const signinVerifyDevice = async (sessionToken: string, code: string): Promise<SigninCompleteResponseDto> => {
    try {
      const response = await signinVerifyDeviceMutation.mutateAsync({
        data: { sessionToken, code },
      });

      const tokens = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };

      // First save tokens
      await tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);

      // Then fetch user profile
      const userData = await fetchUserProfile();

      // Complete login with user data
      await login(tokens, userData || undefined);

      return response;
    } catch (error) {
      console.error("Signin verify device failed:", error);
      throw error;
    }
  };

  // Password Reset Flow
  const requestReset = async (method: "email" | "phone", identifier: string): Promise<RequestResetResponseDto> => {
    try {
      const response = await requestResetMutation.mutateAsync({
        data: { method, identifier: identifier.trim() },
      });

      // Show test code in development
      if (isDevelopment() && response.data.testCode) {
        Alert.alert(
          "Test Code (Dev Only)",
          `Reset code: ${response.data.testCode}\n\nCopy this code to reset your password.`,
          [{ text: "OK" }]
        );
      }

      return response;
    } catch (error) {
      console.error("Request reset failed:", error);
      throw error;
    }
  };

  const verifyReset = async (
    method: "email" | "phone",
    identifier: string,
    code: string
  ): Promise<VerifyResetResponseDto> => {
    try {
      const response = await verifyResetMutation.mutateAsync({
        data: { method, identifier: identifier.trim(), code },
      });
      return response;
    } catch (error) {
      console.error("Verify reset failed:", error);
      throw error;
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<ResetPasswordResponseDto> => {
    try {
      const response = await resetPasswordMutation.mutateAsync({
        data: { resetToken, newPassword },
      });
      return response;
    } catch (error) {
      console.error("Reset password failed:", error);
      throw error;
    }
  };

  // Add Secondary Contact (Post-Registration)
  const addSecondaryContact = async (
    contactType: "email" | "phone",
    contact: string
  ): Promise<AddSecondaryContactResponseDto> => {
    try {
      const contactData = contactType === "email" ? { contactType, email: contact } : { contactType, phone: contact };

      const response = await addSecondaryContactMutation.mutateAsync({
        data: contactData,
      });

      // Show test code in development if verification is required
      if (isDevelopment() && response.data.testCode) {
        Alert.alert(
          "Test Code (Dev Only)",
          `Secondary contact verification code: ${response.data.testCode}\n\nCopy this code to verify your secondary contact.`,
          [{ text: "OK" }]
        );
      }

      return response;
    } catch (error) {
      console.error("Add secondary contact failed:", error);
      throw error;
    }
  };

  // Request Verification Code (General)
  const requestVerify = async (method: "email" | "phone", identifier: string): Promise<RequestVerifyResponseDto> => {
    try {
      const response = await requestVerifyMutation.mutateAsync({
        data: { method, identifier: identifier.trim() },
      });

      // Show test code in development
      if (isDevelopment() && response.data.testCode) {
        Alert.alert(
          "Test Code (Dev Only)",
          `Verification code: ${response.data.testCode}\n\nCopy this code to verify.`,
          [{ text: "OK" }]
        );
      }

      return response;
    } catch (error) {
      console.error("Request verify failed:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    showLoginModal,
    login,
    logout: logoutUser,
    updateUser,
    setShowLoginModal,

    // Step 1: Check Identifier
    checkIdentifier,

    // Signup Flow
    signupVerifyContact,
    verify,
    completeProfile,

    // Signin Flow
    signinInitiate,
    signinPassword,
    signinVerifyDevice,

    // Password Reset Flow
    requestReset,
    verifyReset,
    resetPassword,

    // Add Secondary Contact (Post-Registration)
    addSecondaryContact,

    // Request Verification Code (General)
    requestVerify,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
