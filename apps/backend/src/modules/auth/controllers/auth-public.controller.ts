import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { BaseController } from '../../../common/controllers/base.controller';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth.service';
import {
  PublicEndpoint,
  ProtectedEndpoint,
} from '../../../common/decorators/api-endpoint.decorator';
import { IpThrottle, IpThrottlePresets } from '../../../common/decorators/ip-throttle.decorator';
import { AuditLog, AuditLogPresets } from '../../../common/decorators/audit-log.decorator';
import { AuditLogAction, AuditLogSeverity } from '../../../database/schemas/audit-log.schema';
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
import {
  ListSessionsResponseDto,
  SessionTerminationResponseDto,
} from '../dto/session-response.dto';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { AuditLogListResponseDto, AuditLogEntryDto } from '../dto/audit-log-response.dto';
import { AuditLogService } from '../services/audit-log.service';

/**
 * Public Controller for Authentication
 * Handles all authentication operations accessible without prior authentication
 */
@Controller('public/auth')
@ApiTags('Authentication')
export class AuthPublicController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {
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
  @IpThrottle(IpThrottlePresets.TOKEN_REFRESH)
  @PublicEndpoint(
    'Refresh access token',
    'Generate new access token using valid refresh token',
    RefreshTokenResponseDto,
  )
  async refresh(@Body() refreshDto: RefreshDto): Promise<RefreshTokenResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.refresh(refreshDto);
      },
      'Refresh token',
      'Token Refreshed',
      'Token refreshed successfully',
      'Token refresh failed',
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditLog(AuditLogPresets.LOGOUT)
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
  @IpThrottle(IpThrottlePresets.OTP_REQUEST)
  @PublicEndpoint(
    'Request verification code',
    'Send verification code via email or SMS',
    RequestVerifyResponseDto,
  )
  async requestVerify(@Body() dto: RequestVerifyDto): Promise<RequestVerifyResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.requestVerify(dto);
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
  @IpThrottle(IpThrottlePresets.PASSWORD_RESET)
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
  @AuditLog(AuditLogPresets.PASSWORD_CHANGED)
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
  @IpThrottle(IpThrottlePresets.SIGNUP)
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
  @AuditLog({
    action: AuditLogAction.ACCOUNT_CREATED,
    severity: AuditLogSeverity.MEDIUM,
    resourceType: 'User',
    description: 'New user account created',
  })
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
  @IpThrottle(IpThrottlePresets.AUTH_LOGIN)
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
  @IpThrottle(IpThrottlePresets.AUTH_LOGIN)
  @AuditLog({
    action: AuditLogAction.LOGIN_SUCCESS,
    severity: AuditLogSeverity.MEDIUM,
    description: 'User logged in with password',
  })
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
  @AuditLog({
    action: AuditLogAction.DEVICE_TRUSTED,
    severity: AuditLogSeverity.MEDIUM,
    description: 'Device verified and trusted for user',
  })
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

  @Post('sessions')
  @HttpCode(HttpStatus.OK)
  @ProtectedEndpoint(
    'List active sessions',
    'Get all active sessions/devices for the authenticated user',
    ListSessionsResponseDto,
  )
  async listSessions(@Req() req: AuthRequest): Promise<ListSessionsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.listSessions(req.user._id);
      },
      'List sessions',
      'Sessions Retrieved',
      'Active sessions retrieved successfully',
      'Failed to retrieve sessions',
    ) as Promise<ListSessionsResponseDto>;
  }

  @Post('sessions/:sessionId/terminate')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    ...AuditLogPresets.SESSION_TERMINATED,
    getResourceId: (req) => {
      const body = req.body as Record<string, unknown>;
      return typeof body?.sessionId === 'string' ? body.sessionId : undefined;
    },
  })
  @ProtectedEndpoint(
    'Terminate session',
    'Logout a specific session/device by ID',
    SessionTerminationResponseDto,
  )
  async terminateSession(
    @Req() req: AuthRequest,
    @Body('sessionId') sessionId: string,
  ): Promise<SessionTerminationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.authService.logoutSession(req.user._id, sessionId);
      },
      'Terminate session',
      'Session Terminated',
      'Session terminated successfully',
      'Failed to terminate session',
    ) as Promise<SessionTerminationResponseDto>;
  }

  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  @ProtectedEndpoint(
    'View audit logs',
    'Get audit logs for the authenticated user with optional filtering',
    AuditLogListResponseDto,
  )
  async getAuditLogs(
    @Req() req: AuthRequest,
    @Query() query: AuditLogQueryDto,
  ): Promise<AuditLogListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;

        // Query audit logs for current user
        const entries = await this.auditLogService.query({
          userId: req.user._id,
          action: query.action,
          result: query.result,
          severity: query.severity,
          ipAddress: query.ipAddress,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          limit,
          skip,
        });

        // Get total count for pagination
        const total = await this.auditLogService.count({
          userId: req.user._id,
          action: query.action,
          result: query.result,
          severity: query.severity,
          ipAddress: query.ipAddress,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        });

        // Map to DTOs
        const auditLogEntries: AuditLogEntryDto[] = entries.map((entry) => ({
          id: String(entry._id),
          action: entry.action,
          result: entry.result,
          severity: entry.severity,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          deviceFingerprint: entry.deviceFingerprint,
          metadata: entry.metadata,
          errorMessage: entry.errorMessage,
          description: entry.description,
          createdAt: entry.createdAt,
        }));

        return {
          entries: auditLogEntries,
          total,
          page,
          limit,
        };
      },
      'Get audit logs',
      'Audit Logs Retrieved',
      'Audit logs retrieved successfully',
      'Failed to retrieve audit logs',
    ) as Promise<AuditLogListResponseDto>;
  }
}
