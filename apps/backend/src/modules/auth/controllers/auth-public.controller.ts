import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { BaseController } from '../../../common/controllers/base.controller';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import {
  PublicEndpoint,
  ProtectedEndpoint,
} from '../../../common/decorators/api-endpoint.decorator';
import type { AuthRequest } from '../types/auth.types';

// DTOs
import { VerifyDto } from '../dto/verify.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { RequestVerifyDto } from '../dto/request-verify.dto';
import { RequestVerifyResponseDto } from '../dto/request-verify-response.dto';
import { VerifyResponseDto } from '../dto/verify-response.dto';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';
import { RequestResetDto } from '../dto/request-reset.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { RequestResetResponseDto } from '../dto/request-reset.response.dto';
import { ResetPasswordResponseDto } from '../dto/reset-password-response.dto';
import { VerifyResetDto } from '../dto/verify-reset.dto';
import { VerifyResetResponseDto } from '../dto/verify-reset-response.dto';
import { SignupCompleteProfileDto } from '../dto/signup-complete-profile.dto';
import { SignupCompleteResponseDto } from '../dto/signup-response.dto';
import { SigninInitiateDto } from '../dto/signin-initiate.dto';
import { SigninPasswordDto } from '../dto/signin-password.dto';
import { SigninVerifyDeviceDto } from '../dto/signin-verify-device.dto';
import {
  SigninInitiateResponseDto,
  SigninPasswordResponseDto,
  SigninCompleteResponseDto,
} from '../dto/signin-response.dto';
import { CheckIdentifierDto } from '../dto/check-identifier.dto';
import { CheckIdentifierResponseDto } from '../dto/check-identifier-response.dto';
import { SignupVerifyContactDto } from '../dto/signup-initiate.dto';
import { SignupInitiateResponseDto } from '../dto/signup-response.dto';
import { AddSecondaryContactDto } from '../dto/add-secondary-contact.dto';
import { AddSecondaryContactResponseDto } from '../dto/add-secondary-contact-response.dto';

/**
 * Public Controller for Authentication
 * Handles all authentication operations accessible without prior authentication
 */
@Controller('public/auth')
@ApiTags('Authentication')
export class AuthPublicController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('check-identifier')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Check identifier',
    'Check if email/phone exists and determine signup vs signin flow',
    CheckIdentifierResponseDto,
  )
  async checkIdentifier(@Body() dto: CheckIdentifierDto): Promise<CheckIdentifierResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.checkIdentifier(dto);
      },
      'Check identifier',
      'Identifier Checked',
      'Identifier checked successfully',
      'Failed to check identifier',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Refresh access token',
    'Generate new access token using valid refresh token',
    RefreshTokenResponseDto,
  )
  async refresh(@Body() refreshDto: RefreshDto): Promise<RefreshTokenResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.refreshTokens(refreshDto);
      },
      'Refresh token',
      'Token Refreshed',
      'Token refreshed successfully',
      'Token refresh failed',
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ProtectedEndpoint('User logout', 'Logout user and invalidate refresh tokens', LogoutResponseDto)
  async logout(@Req() req: AuthRequest): Promise<LogoutResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.logout(req.user._id);
      },
      'Logout',
      'Logout Successful',
      'Logout successful',
      'Logout failed',
    );
  }

  @Post('request-verify')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Request verification code',
    'Send verification code via email or SMS',
    RequestVerifyResponseDto,
  )
  async requestVerify(@Body() dto: RequestVerifyDto): Promise<RequestVerifyResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.requestVerificationCode(dto);
      },
      'Request verification',
      'Verification Code Sent',
      'Verification code sent',
      'Failed to send verification code',
    );
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Verify code',
    'Complete registration or verification with OTP code',
    VerifyResponseDto,
  )
  async verify(@Body() dto: VerifyDto): Promise<VerifyResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.verifyCode(dto);
      },
      'Verify code',
      'Verification Successful',
      'Verification successful',
      'Verification failed',
    );
  }

  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Request password reset',
    'Send password reset code to email or phone',
    RequestResetResponseDto,
  )
  async requestReset(@Body() dto: RequestResetDto): Promise<RequestResetResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.requestPasswordReset(dto);
      },
      'Request password reset',
      'Password Reset Code Sent',
      'Password reset code sent',
      'Failed to send reset code',
    );
  }

  @Post('verify-reset')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Verify reset code',
    'Verify OTP code and get temporary reset token',
    VerifyResetResponseDto,
  )
  async verifyReset(@Body() dto: VerifyResetDto): Promise<VerifyResetResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.verifyReset(dto);
      },
      'Verify reset code',
      'Code Verified',
      'Reset code verified successfully',
      'Failed to verify reset code',
    ) as Promise<VerifyResetResponseDto>;
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Reset password',
    'Reset password using verification code and new password',
    ResetPasswordResponseDto,
  )
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.resetPassword(dto);
      },
      'Reset password',
      'Password Reset Successful',
      'Password reset successful',
      'Password reset failed',
    );
  }

  @Post('signup/verify-contact')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Verify signup contact',
    'Send verification code to email or phone for new user registration',
    SignupInitiateResponseDto,
  )
  async signupVerifyContact(
    @Body() dto: SignupVerifyContactDto,
  ): Promise<SignupInitiateResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.signupVerifyContact(dto);
      },
      'Signup verify contact',
      'Verification Code Sent',
      'Verification code sent for signup',
      'Failed to send signup verification',
    ) as Promise<SignupInitiateResponseDto>;
  }

  @Post('signup/complete-profile')
  @HttpCode(HttpStatus.CREATED)
  @PublicEndpoint(
    'Complete signup profile',
    'Complete user registration with personal details and create account',
    SignupCompleteResponseDto,
  )
  async signupCompleteProfile(
    @Body() dto: SignupCompleteProfileDto,
  ): Promise<SignupCompleteResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.signupCompleteProfile(dto);
      },
      'Signup complete profile',
      'Registration Completed',
      'Account created successfully',
      'Failed to complete registration',
    ) as Promise<SignupCompleteResponseDto>;
  }

  @Post('signin/initiate')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Initiate sign-in',
    'Start the unified sign-in flow with email/phone identifier',
    SigninInitiateResponseDto,
  )
  async signinInitiate(@Body() dto: SigninInitiateDto): Promise<SigninInitiateResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.signinInitiate(dto);
      },
      'Signin initiate',
      'Sign-in Initiated',
      'Sign-in flow initiated successfully',
      'Failed to initiate sign-in',
    ) as Promise<SigninInitiateResponseDto>;
  }

  @Post('signin/password')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Enter password',
    'Complete sign-in with password or request SMS code',
    SigninPasswordResponseDto,
  )
  async signinPassword(@Body() dto: SigninPasswordDto): Promise<SigninPasswordResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.signinPassword(dto);
      },
      'Signin password',
      'Password Verified',
      'Password verification completed',
      'Password verification failed',
    ) as Promise<SigninPasswordResponseDto>;
  }

  @Post('signin/verify-device')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Verify device',
    'Complete sign-in with device verification code',
    SigninCompleteResponseDto,
  )
  async signinVerifyDevice(@Body() dto: SigninVerifyDeviceDto): Promise<SigninCompleteResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.signinVerifyDevice(dto);
      },
      'Signin verify device',
      'Sign-in Completed',
      'Device verification successful, sign-in completed',
      'Device verification failed',
    ) as Promise<SigninCompleteResponseDto>;
  }

  @Post('add-secondary-contact')
  @HttpCode(HttpStatus.OK)
  @ProtectedEndpoint(
    'Add secondary contact',
    'Add secondary email or phone number to user account',
    AddSecondaryContactResponseDto,
  )
  async addSecondaryContact(
    @Req() req: AuthRequest,
    @Body() dto: AddSecondaryContactDto,
  ): Promise<AddSecondaryContactResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.addSecondaryContact(req.user._id, dto);
      },
      'Add secondary contact',
      'Secondary Contact Added',
      'Secondary contact added successfully',
      'Failed to add secondary contact',
    ) as Promise<AddSecondaryContactResponseDto>;
  }
}
