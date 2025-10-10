import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshDto } from './dto/refresh.dto';
import { UsersFacadeService } from '../users/services/users-facade.service';
import { LoginUserDto, AuthMethod } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { DynamicConfigService } from '../config/config.service';
import { UserDocument } from '../../database/schemas/user.schema';
import { canUserPerformAction } from '../../common/enums/user-status.enums';
import { CheckIdentifierDataDto } from './dto/check-identifier-response.dto';
import { RefreshToken, RefreshTokenDocument } from '../../database/schemas/refresh-token.schema';
import { RequestVerifyDto } from './dto/request-verify.dto';
import { VerifyDto } from './dto/verify.dto';
import {
  VerificationToken,
  VerificationTokenDocument,
} from '../../database/schemas/verification-token.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetDto } from './dto/verify-reset.dto';
import { SigninInitiateDto } from './dto/signin-initiate.dto';
import { SigninPasswordDto } from './dto/signin-password.dto';
import { SigninVerifyDeviceDto } from './dto/signin-verify-device.dto';
import { SignupCompleteProfileDto } from './dto/signup-complete-profile.dto';
import { CheckIdentifierDto } from './dto/check-identifier.dto';
import { SignupInitiateDataDto, SignupCompleteDataDto } from './dto/signup-response.dto';
import {
  SigninInitiateDataDto,
  SigninPasswordDataDto,
  SigninCompleteDataDto,
} from './dto/signin-response.dto';
import { UserDataDto } from '../users/dto/user-response.dto';
import { RegistrationState } from '../../database/schemas/user.schema';
import { CodeDeliveryMethod } from './dto/login.dto';
import { AddSecondaryContactDto } from './dto/add-secondary-contact.dto';
import { AddSecondaryContactDataDto } from './dto/add-secondary-contact-response.dto';
import { CryptoUtil } from '../../common/utils/crypto.utils';
import { OtpUtil } from '../../common/utils/otp.util';
import { DateUtils } from '../../common/utils/date.utils';
import { NotificationService } from '../../common/services/notificaton.service';
import { ConfigService } from '@nestjs/config';
import {
  JwtPayload,
  TokenPair,
  ValidateUserResult,
  OtpConfigOptions,
  VerificationCodeResponse,
  PasswordResetResponse,
  LogoutResponse,
  ResetTokenPayload,
  SigninSessionPayload,
  SignupSessionPayload,
} from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersFacadeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly dynamicConfigService: DynamicConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(VerificationToken.name)
    private readonly vtModel: Model<VerificationTokenDocument>,
  ) {}

  /** Load OTP configuration from dynamic config service */
  private async loadOtpConfig(): Promise<OtpConfigOptions> {
    const [
      length,
      ttlSec,
      cooldownSec,
      maxAttempts,
      resetTtlSec,
      resetMaxAttempts,
      notifyEmail,
      notifySms,
      windowReq,
      windowSec,
    ] = await Promise.all([
      this.dynamicConfigService.getNumber('OTP_LENGTH', 6),
      this.dynamicConfigService.getNumber('OTP_TTL_SECONDS', 300),
      this.dynamicConfigService.getNumber('OTP_RESEND_COOLDOWN_SECONDS', 60),
      this.dynamicConfigService.getNumber('OTP_MAX_ATTEMPTS', 5),

      this.dynamicConfigService.getNumber('RESET_TTL_SECONDS', 600),
      this.dynamicConfigService.getNumber('RESET_MAX_ATTEMPTS', 5),

      this.dynamicConfigService.getBoolean('NOTIFY_EMAIL_ENABLED', false),
      this.dynamicConfigService.getBoolean('NOTIFY_SMS_ENABLED', false),

      this.dynamicConfigService.getNumber('OTP_REQUESTS_PER_WINDOW', 5),
      this.dynamicConfigService.getNumber('OTP_REQUEST_WINDOW_SECONDS', 900),
    ]);

    return {
      length,
      ttlMs: ttlSec * 1000,
      resendCooldownMs: cooldownSec * 1000,
      maxAttempts,
      resetTtlMs: resetTtlSec * 1000,
      resetMaxAttempts,
      notifyEmailEnabled: notifyEmail,
      notifySmsEnabled: notifySms,
      windowRequests: windowReq,
      windowMs: windowSec * 1000,
    };
  }

  /**
   * Generate new access & refresh tokens, hash & store refresh token
   */
  private async generateTokens(userId: string, email: string, roles: string[]): Promise<TokenPair> {
    const sessionExpiresIn = await this.dynamicConfigService.get('SESSION_EXPIRES_IN', '15m');
    const refreshExpiresIn = await this.dynamicConfigService.get('REFRESH_EXPIRES_IN', '7d');
    const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');

    // Generate JWT tokens
    const payload: JwtPayload = { sub: userId, email, roles };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: sessionExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshExpiresIn,
    });

    // Hash and store refresh token
    const hashed = await CryptoUtil.hashPassword(refreshToken);
    const decoded: JwtPayload = this.jwtService.decode(refreshToken);

    if (!decoded || typeof decoded.exp !== 'number') {
      throw new Error('Failed to decode refresh token expiration');
    }

    const expiresAtUnix = (decoded?.exp || 0) * 1000;
    await this.refreshTokenModel.create({
      user: userId,
      tokenHash: hashed,
      expiresAt: DateUtils.create(expiresAtUnix),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Validate identifier format (email or phone)
   */
  private validateIdentifier(identifier: string): ValidateUserResult {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    const isEmail = emailRegex.test(identifier);
    const isPhone = phoneRegex.test(identifier);

    return {
      isEmail,
      isValid: isEmail || isPhone,
    };
  }

  /**
   * Check if identifier (email or phone) exists, and which methods are enabled.
   */
  async checkIdentifier(dto: CheckIdentifierDto): Promise<CheckIdentifierDataDto> {
    const { isEmail, isValid } = this.validateIdentifier(dto.identifier);

    if (!isValid) {
      throw new BadRequestException(
        'Invalid identifier format. Must be a valid email or phone number',
      );
    }

    const user = isEmail
      ? await this.usersService.findForAuthByEmail(dto.identifier)
      : await this.usersService.findByPhone(dto.identifier);

    if (!user) {
      return { exists: false, methods: [] };
    }

    const methods: AuthMethod[] = [];

    // Password login
    if (isEmail && user.passwordHash) {
      methods.push(AuthMethod.EMAIL);
    }
    if (!isEmail && user.passwordHash) {
      methods.push(AuthMethod.PHONE);
    }

    // Social logins
    if (user.googleId) methods.push(AuthMethod.GOOGLE);
    if (user.facebookId) methods.push(AuthMethod.FACEBOOK);
    if (user.appleId) methods.push(AuthMethod.APPLE);

    return { exists: true, methods };
  }

  /**
   * Registers a new user and issues a JWT
   */
  async register(createDto: CreateUserDto): Promise<VerificationCodeResponse> {
    // 1) Basic uniqueness checks
    if (createDto.email) {
      const existing = await this.usersService.findByEmail(createDto.email);
      if (existing) throw new ConflictException('Email already in use');
    }
    if (createDto.phone) {
      const existing = await this.usersService.findByPhone(createDto.phone);
      if (existing) throw new ConflictException('Phone already in use');
    }

    // Must have at least one identifier to verify
    const hasEmail = Boolean(createDto.email);
    const hasPhone = Boolean(createDto.phone);
    if (!hasEmail && !hasPhone) {
      throw new BadRequestException('Email or phone is required for verification');
    }

    // Validate password strength before creating user (if password provided)
    if (createDto.password) {
      await this.validatePasswordStrength(createDto.password);
    }

    // 2) Create user (verified flags should be false by default in your schema)
    const user = await this.usersService.create(createDto);

    // 3) Decide which channel to verify now
    const method: AuthMethod = hasPhone ? AuthMethod.PHONE : AuthMethod.EMAIL;

    const identifier = method === AuthMethod.PHONE ? user.phone! : user.email!;
    if (!identifier) {
      // Extra guard in case DTO lacks what we expected
      throw new BadRequestException(`Missing identifier for ${method.toLowerCase()} verification`);
    }

    // 4) Reuse existing OTP flow
    const dto: RequestVerifyDto = { method, identifier };
    return this.requestVerify(dto);
  }

  /**
   * Validate method and identifier consistency
   */
  private validateMethodIdentifierConsistency(method: AuthMethod, identifier: string): void {
    const { isEmail } = this.validateIdentifier(identifier);

    if (method === AuthMethod.EMAIL && !isEmail) {
      throw new BadRequestException('Email method requires a valid email address');
    }

    if (method === AuthMethod.PHONE && isEmail) {
      throw new BadRequestException('Phone method requires a valid phone number');
    }
  }

  /**
   * Authenticates user based on method and issues a JWT
   */
  async login(loginDto: LoginUserDto): Promise<TokenPair> {
    // Validate identifier format
    const { isValid } = this.validateIdentifier(loginDto.identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate method and identifier consistency
    this.validateMethodIdentifierConsistency(loginDto.method, loginDto.identifier);

    // Rate limiting check could be added here based on identifier

    let user: UserDocument | null = null;
    switch (loginDto.method) {
      case AuthMethod.EMAIL:
        user = await this.usersService.findForAuthByEmail(loginDto.identifier);
        break;
      case AuthMethod.PHONE:
        user = await this.usersService.findByPhone(loginDto.identifier);
        break;
      default:
        throw new BadRequestException('Unsupported login method');
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check if account can login
    if (!canUserPerformAction(user.status, 'canLogin')) {
      throw new UnauthorizedException(`Account is ${user.status} and cannot login`);
    }

    if ([AuthMethod.EMAIL, AuthMethod.PHONE].includes(loginDto.method)) {
      if (!loginDto.password) throw new BadRequestException('Password is required for this method');

      if (!user.passwordHash) {
        throw new UnauthorizedException('Password authentication not enabled for this account');
      }

      const valid = await this.usersService.validatePassword(String(user._id), loginDto.password);
      if (!valid) throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(String(user._id), user.email!, user.roles);
  }

  /** Send a new OTP to email or phone */
  async requestVerify(dto: RequestVerifyDto): Promise<VerificationCodeResponse> {
    const { identifier, method } = dto;

    // Validate identifier format
    const { isValid } = this.validateIdentifier(identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate method and identifier consistency
    this.validateMethodIdentifierConsistency(method, identifier);

    // Load OTP configuration
    const cfg = await this.loadOtpConfig();

    // 1) Find the user
    const user =
      method === AuthMethod.EMAIL
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByPhone(identifier);

    if (!user) throw new UnauthorizedException(`No account for ${identifier}`);

    // 2) Check if user is already verified for the requested method
    if (method === AuthMethod.EMAIL && user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    if (method === AuthMethod.PHONE && user.isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }

    // 3) Enforce resend cooldown & sliding window
    const existing = await this.vtModel.findOne({ user: user._id, type: method }).exec();
    const now = DateUtils.now();

    if (
      existing?.lastSentAt &&
      now.getTime() - existing.lastSentAt.getTime() < cfg.resendCooldownMs
    ) {
      throw new BadRequestException('Please wait before requesting another code');
    }

    // simple sliding window using requestLog on the same doc
    const windowStart = DateUtils.create(now.getTime() - cfg.windowMs);
    const requestLog = (existing?.requestLog ?? []).filter((ts) => ts >= windowStart);
    if (requestLog.length >= cfg.windowRequests) {
      throw new BadRequestException('Too many requests. Try again later.');
    }
    requestLog.push(now);

    // 4) Generate OTP with configured length
    const code = OtpUtil.generate(cfg.length);
    const expiresAt = DateUtils.create(now.getTime() + cfg.ttlMs);

    // 5) Hash the code and upsert (one code per user/type)
    const codeHash = await CryptoUtil.hashPassword(code);
    await this.vtModel
      .findOneAndUpdate(
        { user: user._id, type: method },
        {
          codeHash,
          expiresAt,
          used: false,
          attempts: 0,
          lastSentAt: now,
          requestLog,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    // 6) Send OTP via notification service using user preference
    try {
      const canSend =
        (method === AuthMethod.EMAIL && cfg.notifyEmailEnabled) ||
        (method === AuthMethod.PHONE && cfg.notifySmsEnabled);
      if (!canSend) {
        // In non-prod you might want to expose the code; in prod, silently succeed
        if (process.env.NODE_ENV !== 'production') return { success: true, testCode: code };
        return { success: true };
      }

      // Get user preferences to determine OTP delivery method
      const userPreferences = await this.usersService.getUserPreferences(String(user._id));

      // Send OTP using user's preferred method if they have both email and phone
      if ((user.email || user.phone) && userPreferences?.otpNotificationMethod) {
        await this.notificationService.sendOtpByPreference(
          userPreferences.otpNotificationMethod,
          user.email,
          user.phone,
          code,
        );
      } else {
        // Fallback to original method-based sending
        await this.notificationService.sendOtp(method, identifier, code);
      }
    } catch {
      // In non-production, don't fail if sending fails - still return success with test code
      if (process.env.NODE_ENV === 'production') {
        // If sending fails in production, clean up the token and throw error
        await this.vtModel.deleteOne({ user: user._id, type: method }).exec();
        throw new BadRequestException('Failed to send verification code');
      }
      // In development, continue with success response including test code
    }

    if (process.env.NODE_ENV !== 'production') {
      return { success: true, testCode: code };
    }
    return { success: true };
  }

  /** Verify the submitted OTP */
  async verify(dto: VerifyDto): Promise<TokenPair> {
    const { identifier, method, code } = dto;

    // Validate identifier format
    const { isValid } = this.validateIdentifier(identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate method and identifier consistency
    this.validateMethodIdentifierConsistency(method, identifier);

    // Load OTP configuration
    const cfg = await this.loadOtpConfig();

    // Validate code format (should be 6 digits)
    const re = new RegExp(`^\\d{${cfg.length}}$`);
    if (!re.test(code)) throw new BadRequestException(`Code must be a ${cfg.length}-digit number`);

    // 1) Lookup user
    const user =
      method === AuthMethod.EMAIL
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByPhone(identifier);

    if (!user) throw new UnauthorizedException(`No account for ${identifier}`);

    // 2) Lookup token record and verify code
    const record = await this.vtModel.findOne({ user: user._id, type: method }).exec();

    if (!record) {
      throw new BadRequestException('Invalid verification code');
    }

    // lockout on attempts
    if (record.attempts >= cfg.maxAttempts) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    // Check expiry first to provide better error message
    if (record.expiresAt.getTime() < DateUtils.nowTimestamp()) {
      // Clean up expired token
      await this.vtModel.deleteOne({ _id: record._id }).exec();
      throw new BadRequestException('Verification code expired');
    }

    const codeValid = await CryptoUtil.comparePassword(code, record.codeHash);
    if (!codeValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // 3) Clean up
    await this.vtModel.deleteOne({ _id: record._id }).exec();

    // 4) Mark user verified
    if (method === AuthMethod.EMAIL) {
      await this.usersService.markEmailVerified(String(user._id));
    } else {
      await this.usersService.markPhoneVerified(String(user._id));
    }

    // 5) Issue tokens
    return this.generateTokens(String(user._id), user.email || identifier, user.roles);
  }

  async requestPasswordReset(dto: RequestResetDto): Promise<VerificationCodeResponse> {
    // Validate identifier format
    const { isValid } = this.validateIdentifier(dto.identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate method and identifier consistency
    this.validateMethodIdentifierConsistency(dto.method, dto.identifier);

    // Load OTP configuration
    const cfg = await this.loadOtpConfig();

    // Check if identifier exists
    const user = await this.usersService.findUserByIdentifier(dto.identifier, dto.method);
    if (!user) {
      // For security, don't reveal whether user exists or not
      if (process.env.NODE_ENV !== 'production') {
        throw new NotFoundException('User not found with provided identifier');
      }
      return { success: true }; // Always return success in production
    }

    // Check if user is verified for the method they're trying to reset
    if (dto.method === AuthMethod.EMAIL && !user.isEmailVerified) {
      throw new BadRequestException('Email must be verified before password reset');
    }
    if (dto.method === AuthMethod.PHONE && !user.isPhoneVerified) {
      throw new BadRequestException('Phone must be verified before password reset');
    }

    // Check if user has password authentication enabled
    if (!user.passwordHash) {
      // Provide more helpful error message based on user's auth methods
      const authMethods: string[] = [];
      if (user.googleId) authMethods.push('Google');
      if (user.facebookId) authMethods.push('Facebook');
      if (user.appleId) authMethods.push('Apple');

      if (authMethods.length > 0) {
        throw new BadRequestException(
          `This account uses ${authMethods.join(', ')} login. Please sign in using your ${authMethods[0]} account or set a password first.`,
        );
      } else {
        throw new BadRequestException(
          'No password is set for this account. Please complete your registration or contact support.',
        );
      }
    }

    // Note: Rate limiting for password reset could be implemented here
    // For now, allow multiple requests and let the upsert handle token replacement

    const code = OtpUtil.generate(cfg.length);
    const expiresAt = DateUtils.create(DateUtils.nowTimestamp() + cfg.resetTtlMs);

    // Hash the code and upsert one token per user+type (less flakiness than create)
    const codeHash = await CryptoUtil.hashPassword(code);
    await this.vtModel
      .findOneAndUpdate(
        { user: user._id, type: dto.method },
        { codeHash, expiresAt, used: false },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    const canSend =
      (dto.method === AuthMethod.EMAIL && cfg.notifyEmailEnabled) ||
      (dto.method === AuthMethod.PHONE && cfg.notifySmsEnabled);

    if (canSend) {
      try {
        // Get user preferences to determine OTP delivery method
        const userPreferences = await this.usersService.getUserPreferences(String(user._id));

        // Send OTP using user's preferred method if they have both email and phone
        if (user.email && user.phone && userPreferences?.otpNotificationMethod) {
          await this.notificationService.sendOtpByPreference(
            userPreferences.otpNotificationMethod,
            user.email,
            user.phone,
            code,
          );
        } else {
          // Fallback to original method-based sending
          await this.notificationService.sendOtp(dto.method, dto.identifier, code);
        }
      } catch {
        // In non-production, don't fail if sending fails - still return success with test code
        if (process.env.NODE_ENV === 'production') {
          // If sending fails in production, clean up the token and throw error
          await this.vtModel.deleteOne({ user: user._id, type: dto.method }).exec();
          throw new BadRequestException('Failed to send reset code');
        }
        // In development, continue with success response including test code
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      return { success: true, testCode: code };
    }
    return { success: true };
  }

  async verifyReset(dto: VerifyResetDto): Promise<{ resetToken: string; expiresAt: string }> {
    // Validate identifier format
    const { isValid } = this.validateIdentifier(dto.identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate method and identifier consistency
    this.validateMethodIdentifierConsistency(dto.method, dto.identifier);

    // Load OTP configuration
    const cfg = await this.loadOtpConfig();

    // Validate code format
    const re = new RegExp(`^\\d{${cfg.length}}$`);
    if (!re.test(dto.code)) {
      throw new BadRequestException(`Code must be a ${cfg.length}-digit number`);
    }

    const user = await this.usersService.findUserByIdentifier(dto.identifier, dto.method);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find unused token and verify code
    const token = await this.vtModel
      .findOne({
        user: user._id,
        type: dto.method,
        expiresAt: { $gt: DateUtils.now() },
        used: false,
      })
      .exec();

    if (!token) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (token.attempts >= cfg.resetMaxAttempts) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    const codeValid = await CryptoUtil.comparePassword(dto.code, token.codeHash);
    if (!codeValid) {
      // Increment attempts
      await this.vtModel.findByIdAndUpdate(token._id, { $inc: { attempts: 1 } }).exec();
      throw new BadRequestException('Invalid code');
    }

    // Mark token as used
    await this.vtModel.findByIdAndUpdate(token._id, { used: true }).exec();

    // Generate a temporary reset token (JWT)
    const resetTokenExpiresIn = '15m'; // 15 minutes
    const resetPayload: ResetTokenPayload = {
      sub: String(user._id),
      type: 'password_reset',
    };

    const resetToken = this.jwtService.sign(resetPayload, {
      expiresIn: resetTokenExpiresIn,
    });

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    return {
      resetToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<PasswordResetResponse> {
    // Validate new password strength (additional layer beyond DTO validation)
    await this.validatePasswordStrength(dto.newPassword);

    // Verify and decode the reset token
    let payload: ResetTokenPayload;
    try {
      payload = this.jwtService.verify(dto.resetToken);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify token type
    if (payload.type !== 'password_reset') {
      throw new BadRequestException('Invalid token type');
    }

    // Find the user
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new password is the same as current password
    if (
      user.passwordHash &&
      (await CryptoUtil.comparePassword(dto.newPassword, user.passwordHash))
    ) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash and save new password
    const passwordHash = await CryptoUtil.hashPassword(dto.newPassword);
    user.passwordHash = passwordHash;
    await user.save();

    // Invalidate all refresh tokens for security
    await this.refreshTokenModel.deleteMany({ user: user._id }).exec();

    return { success: true };
  }

  async refresh(refreshDto: RefreshDto): Promise<TokenPair> {
    const { refreshToken } = refreshDto;

    // Validate JWT format
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    if (!jwtRegex.test(refreshToken)) {
      throw new BadRequestException('Invalid token format');
    }

    // Verify token hasn't expired by checking JWT payload
    try {
      const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');

      // This will throw if token is expired or invalid
      this.jwtService.verify(refreshToken, { secret: refreshTokenSecret });
    } catch {
      throw new UnauthorizedException('Token expired or invalid');
    }

    // Find matching hashed token
    const tokens = await this.refreshTokenModel
      .find({ expiresAt: { $gt: DateUtils.now() } })
      .exec();
    let match: RefreshTokenDocument | null = null;
    for (const t of tokens) {
      if (await CryptoUtil.comparePassword(refreshToken, t.tokenHash)) {
        match = t;
        break;
      }
    }
    if (!match) throw new UnauthorizedException('Invalid refresh token');

    // Verify user still exists and is active
    const user = await this.usersService.findById(match.user.toString());
    if (!user) {
      // Clean up orphaned token
      await this.refreshTokenModel.deleteOne({ _id: match._id }).exec();
      throw new UnauthorizedException('User no longer exists');
    }

    // Remove old refresh token (rotation)
    await this.refreshTokenModel.deleteOne({ _id: match._id }).exec();

    // Issue new tokens
    return this.generateTokens(String(user._id), user.email!, user.roles);
  }

  async logout(userId: string): Promise<LogoutResponse> {
    // Remove all refresh tokens for this user
    await this.refreshTokenModel.deleteMany({ user: userId }).exec();
    return { message: 'Logout successful' };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  // Alias methods for controller compatibility
  async refreshTokens(refreshDto: RefreshDto): Promise<TokenPair> {
    return this.refresh(refreshDto);
  }

  async requestVerificationCode(dto: RequestVerifyDto): Promise<VerificationCodeResponse> {
    return this.requestVerify(dto);
  }

  async verifyCode(dto: VerifyDto): Promise<{
    ownershipVerified: boolean;
    verifiedIdentifier: string;
    accessToken?: string;
    refreshToken?: string;
    signupSessionToken?: string;
  }> {
    const { identifier, method, code } = dto;

    // Validate identifier format
    const { isValid } = this.validateIdentifier(identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate method and identifier consistency
    this.validateMethodIdentifierConsistency(method, identifier);

    // Load OTP configuration
    const cfg = await this.loadOtpConfig();

    // Validate code format (should be 6 digits)
    const re = new RegExp(`^\\d{${cfg.length}}$`);
    if (!re.test(code)) throw new BadRequestException(`Code must be a ${cfg.length}-digit number`);

    // 1) Lookup user
    const user =
      method === AuthMethod.EMAIL
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByPhone(identifier);

    if (!user) {
      // This is ownership verification for a new user
      // Verify the OTP is valid for this identifier
      const query = {
        identifier: identifier,
        type: method,
        used: false,
        expiresAt: { $gt: DateUtils.now() },
      };

      const record = await this.vtModel.findOne(query).exec();

      if (!record) {
        throw new BadRequestException('Invalid verification code');
      }

      if (record.attempts >= cfg.maxAttempts) {
        throw new BadRequestException('Too many attempts. Request a new code.');
      }

      const codeValid = await CryptoUtil.comparePassword(code, record.codeHash);
      if (!codeValid) {
        await this.vtModel.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } }).exec();
        throw new BadRequestException('Invalid verification code');
      }

      // Clean up the verification record
      await this.vtModel.deleteOne({ _id: record._id }).exec();

      // Generate signup session token
      const signupSessionPayload: SignupSessionPayload = {
        sub: CryptoUtil.generateTempId(), // Generate a temporary ID
        type: 'signup_session',
        step: 'verified_contact',
        identifier: identifier,
        method: method === AuthMethod.EMAIL ? 'email' : 'phone',
      };

      const signupSessionToken = this.jwtService.sign(signupSessionPayload, {
        expiresIn: '15m', // 15 minutes for completing signup
      });

      return {
        ownershipVerified: true,
        verifiedIdentifier: identifier,
        signupSessionToken,
      };
    }

    // User exists - proceed with normal verification
    const record = await this.vtModel
      .findOne({
        user: user._id,
        type: method,
        used: false,
        expiresAt: { $gt: DateUtils.now() },
      })
      .exec();

    if (!record) {
      throw new BadRequestException('Invalid verification code');
    }

    if (record.attempts >= cfg.maxAttempts) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    if (record.expiresAt.getTime() < DateUtils.nowTimestamp()) {
      await this.vtModel.deleteOne({ _id: record._id }).exec();
      throw new BadRequestException('Verification code expired');
    }

    const codeValid = await CryptoUtil.comparePassword(code, record.codeHash);
    if (!codeValid) {
      // Increment attempts before throwing error
      await this.vtModel.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } }).exec();
      throw new BadRequestException('Invalid verification code');
    }

    // Clean up
    await this.vtModel.deleteOne({ _id: record._id }).exec();

    // Mark user verified
    if (method === AuthMethod.EMAIL) {
      await this.usersService.markEmailVerified(String(user._id));
    } else {
      await this.usersService.markPhoneVerified(String(user._id));
    }

    // Issue tokens
    const tokens = await this.generateTokens(
      String(user._id),
      user.email || identifier,
      user.roles,
    );

    return {
      ownershipVerified: false,
      verifiedIdentifier: identifier,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async validatePasswordStrength(password: string): Promise<void> {
    const minLengthStr = String(await this.configService.get('PASSWORD_MIN_LENGTH', '8'));
    const minLength = parseInt(minLengthStr, 10);

    const requireSpecialCharsStr = String(
      await this.configService.get('PASSWORD_REQUIRE_SPECIAL_CHARS', 'true'),
    );
    const requireSpecialChars = requireSpecialCharsStr.toLowerCase() === 'true';

    if (password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters long`);
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (requireSpecialChars && !/(?=.*[^A-Za-z\d])/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }

  // Signin flow methods
  async signinInitiate(dto: SigninInitiateDto): Promise<SigninInitiateDataDto> {
    const { identifier } = dto;

    // Validate identifier format
    const { isEmail, isValid } = this.validateIdentifier(identifier);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Determine method from identifier
    const method = isEmail ? AuthMethod.EMAIL : AuthMethod.PHONE;

    // Check if user exists
    const user = isEmail
      ? await this.usersService.findForAuthByEmail(identifier)
      : await this.usersService.findByPhone(identifier);

    if (!user) {
      // User doesn't exist - send OTP for ownership verification
      const cfg = await this.loadOtpConfig();
      const code = OtpUtil.generate(cfg.length);
      const expiresAt = DateUtils.create(DateUtils.nowTimestamp() + cfg.ttlMs);

      // Store verification token without user association
      const codeHash = await CryptoUtil.hashPassword(code);
      await this.vtModel
        .findOneAndUpdate(
          { identifier: identifier, type: method },
          {
            codeHash,
            expiresAt,
            used: false,
            attempts: 0,
            lastSentAt: DateUtils.now(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )
        .exec();

      // Send OTP
      try {
        const canSend =
          (method === AuthMethod.EMAIL && cfg.notifyEmailEnabled) ||
          (method === AuthMethod.PHONE && cfg.notifySmsEnabled);

        if (canSend) {
          await this.notificationService.sendOtp(method, identifier, code);
        }
      } catch {
        // In signin flow, we don't want to fail the entire operation if OTP sending fails
        // We still want to return userExists: false to inform the frontend
        // Just clean up the verification token since we couldn't send the OTP
        await this.vtModel.deleteOne({ identifier: identifier, type: method }).exec();
        // Log the error but don't throw for signin flow
        // Continuing without OTP for signin flow
      }

      // Generate session token for this flow
      const sessionPayload: SigninSessionPayload = {
        sub: CryptoUtil.generateTempId(),
        type: 'signin_session',
        step: 'initiated',
        identifier: identifier,
        method: method === AuthMethod.EMAIL ? 'email' : 'phone',
      };

      const sessionToken = this.jwtService.sign(sessionPayload, {
        expiresIn: '15m',
      });

      return {
        userExists: false,
        sessionToken,
        nextStep: 'verify_signup',
        testCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      };
    }

    // User exists - proceed to password step
    const sessionPayload: SigninSessionPayload = {
      sub: String(user._id),
      type: 'signin_session',
      step: 'initiated',
      identifier: identifier,
      method: method === AuthMethod.EMAIL ? 'email' : 'phone',
    };

    const sessionToken = this.jwtService.sign(sessionPayload, {
      expiresIn: '15m',
    });

    return {
      userExists: true,
      sessionToken,
      nextStep: 'password',
      hasPassword: Boolean(user.passwordHash),
    };
  }

  async signinPassword(dto: SigninPasswordDto): Promise<SigninPasswordDataDto> {
    // Verify session token
    let decodedToken: unknown;
    try {
      decodedToken = this.jwtService.verify(dto.sessionToken);
    } catch {
      throw new BadRequestException('Invalid or expired session token');
    }

    const sessionPayload = decodedToken as SigninSessionPayload;
    if (sessionPayload.type !== 'signin_session' || sessionPayload.step !== 'initiated') {
      throw new BadRequestException('Invalid session state');
    }

    // Find user with password hash for authentication
    const user = await this.usersService.findForAuthById(sessionPayload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if account can login
    if (!canUserPerformAction(user.status, 'canLogin')) {
      throw new UnauthorizedException(`Account is ${user.status} and cannot login`);
    }

    // Validate password
    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Password authentication not enabled for this account');
    }

    const valid = await this.usersService.validatePassword(String(user._id), dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if device verification is required (simple logic - can be enhanced)
    const requiresDeviceVerification = false; // For now, skip device verification

    if (!requiresDeviceVerification) {
      // Complete signin immediately
      const tokens = await this.generateTokens(String(user._id), user.email!, user.roles);
      const userData = plainToInstance(UserDataDto, user.toObject());
      return {
        requiresDeviceVerification: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userData,
      };
    }

    // Device verification required
    const cfg = await this.loadOtpConfig();
    const code = OtpUtil.generate(cfg.length);
    const expiresAt = DateUtils.create(DateUtils.nowTimestamp() + cfg.ttlMs);

    // Store verification token
    const codeHash = await CryptoUtil.hashPassword(code);
    await this.vtModel
      .findOneAndUpdate(
        { user: user._id, type: 'device_verification' },
        {
          codeHash,
          expiresAt,
          used: false,
          attempts: 0,
          lastSentAt: DateUtils.now(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    // Send verification code
    try {
      const method = sessionPayload.method === 'email' ? AuthMethod.EMAIL : AuthMethod.PHONE;
      await this.notificationService.sendOtp(method, sessionPayload.identifier, code);
    } catch {
      // In non-production, don't fail if sending fails - still return success with test code
      if (process.env.NODE_ENV === 'production') {
        // If sending fails in production, clean up the token and throw error
        await this.vtModel.deleteOne({ user: user._id, type: 'device_verification' }).exec();
        throw new BadRequestException('Failed to send verification code');
      }
      // In development, continue with success response including test code
    }

    // Update session token
    const updatedSessionPayload: SigninSessionPayload = {
      ...sessionPayload,
      step: 'device_verification',
    };

    const updatedSessionToken = this.jwtService.sign(updatedSessionPayload, {
      expiresIn: '15m',
    });

    return {
      requiresDeviceVerification: true,
      sessionToken: updatedSessionToken,
      testCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async signinVerifyDevice(dto: SigninVerifyDeviceDto): Promise<SigninCompleteDataDto> {
    // Verify session token
    let decodedToken: unknown;
    try {
      decodedToken = this.jwtService.verify(dto.sessionToken);
    } catch {
      throw new BadRequestException('Invalid or expired session token');
    }

    const sessionPayload = decodedToken as SigninSessionPayload;
    if (sessionPayload.type !== 'signin_session' || sessionPayload.step !== 'device_verification') {
      throw new BadRequestException('Invalid session state');
    }

    // Find user
    const user = await this.usersService.findById(sessionPayload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Load OTP configuration
    const cfg = await this.loadOtpConfig();

    // Validate code format
    const re = new RegExp(`^\\d{${cfg.length}}$`);
    if (!re.test(dto.code)) {
      throw new BadRequestException(`Code must be a ${cfg.length}-digit number`);
    }

    // Find and verify token
    const record = await this.vtModel
      .findOne({
        user: user._id,
        type: 'device_verification',
        used: false,
        expiresAt: { $gt: DateUtils.now() },
      })
      .exec();

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (record.attempts >= cfg.maxAttempts) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    const codeValid = await CryptoUtil.comparePassword(dto.code, record.codeHash);
    if (!codeValid) {
      await this.vtModel.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } }).exec();
      throw new BadRequestException('Invalid verification code');
    }

    // Clean up verification record
    await this.vtModel.deleteOne({ _id: record._id }).exec();

    // Complete signin
    const tokens = await this.generateTokens(String(user._id), user.email!, user.roles);
    const userData = plainToInstance(UserDataDto, user.toObject());
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userData,
    };
  }

  async signupVerifyContact(dto: { identifier: string }): Promise<SignupInitiateDataDto> {
    const { isEmail, isValid } = this.validateIdentifier(dto.identifier);

    if (!isValid) {
      throw new BadRequestException(
        'Invalid identifier format. Must be a valid email or phone number',
      );
    }

    // Check if user already exists
    const existingUser = isEmail
      ? await this.usersService.findByEmail(dto.identifier)
      : await this.usersService.findByPhone(dto.identifier);

    if (existingUser) {
      throw new ConflictException('Account already exists with this identifier');
    }

    // Send verification code for signup (user doesn't exist yet)
    const method = isEmail ? AuthMethod.EMAIL : AuthMethod.PHONE;
    const cfg = await this.loadOtpConfig();
    const code = OtpUtil.generate(cfg.length);
    const expiresAt = DateUtils.create(DateUtils.nowTimestamp() + cfg.ttlMs);

    // Store verification token for signup
    const codeHash = await CryptoUtil.hashPassword(code);
    await this.vtModel
      .findOneAndUpdate(
        { identifier: dto.identifier, type: method },
        {
          codeHash,
          expiresAt,
          used: false,
          attempts: 0,
          lastSentAt: DateUtils.now(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    // Send OTP
    try {
      const canSend =
        (method === AuthMethod.EMAIL && cfg.notifyEmailEnabled) ||
        (method === AuthMethod.PHONE && cfg.notifySmsEnabled);

      if (canSend) {
        await this.notificationService.sendOtp(method, dto.identifier, code);
      }
    } catch {
      // In non-production, don't fail if sending fails - still return success with test code
      if (process.env.NODE_ENV === 'production') {
        // Clean up the verification token if sending fails in production
        await this.vtModel.deleteOne({ identifier: dto.identifier, type: method }).exec();
        throw new BadRequestException('Failed to send verification code');
      }
      // In development, continue with success response including test code
    }

    return {
      success: true,
      testCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      registrationState: RegistrationState.CONTACT_PENDING,
      codeDeliveryMethod: isEmail ? CodeDeliveryMethod.EMAIL : CodeDeliveryMethod.SMS,
    };
  }

  async signupCompleteProfile(dto: SignupCompleteProfileDto): Promise<SignupCompleteDataDto> {
    // Verify session token
    let decodedToken: unknown;
    try {
      decodedToken = this.jwtService.verify(dto.sessionToken);
    } catch {
      throw new BadRequestException('Invalid or expired session token');
    }

    const sessionPayload = decodedToken as SignupSessionPayload;
    if (sessionPayload.type !== 'signup_session' || sessionPayload.step !== 'verified_contact') {
      throw new BadRequestException('Invalid session state');
    }

    // Validate password strength
    await this.validatePasswordStrength(dto.password);

    // Check if identifier is already taken
    const identifier = sessionPayload.identifier;
    const method = sessionPayload.method;

    const existingUser =
      method === 'email'
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByPhone(identifier);

    if (existingUser) {
      throw new ConflictException('Account already exists with this identifier');
    }

    // Create user data object
    const createUserData: CreateUserDto = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      birthDate: dto.birthDate,
      password: dto.password,
    };

    // Add the verified identifier
    if (method === 'email') {
      createUserData.email = identifier;
    } else {
      createUserData.phone = identifier;
    }

    // Add optional secondary contact if provided
    let secondaryContactNeedsVerification = false;
    let missingContactType: 'email' | 'phone' | undefined;

    if (method === 'email' && dto.phone) {
      // Signed up with email, provided phone as secondary
      createUserData.phone = dto.phone;
      secondaryContactNeedsVerification = true;
    } else if (method === 'phone' && dto.email) {
      // Signed up with phone, provided email as secondary
      createUserData.email = dto.email;
      secondaryContactNeedsVerification = true;
    } else {
      // No secondary contact provided - determine what's missing
      missingContactType = method === 'email' ? 'phone' : 'email';
    }

    // Create the user
    const user = await this.usersService.create(createUserData);

    // Mark the primary identifier as verified since we verified it in the previous step
    if (method === 'email') {
      await this.usersService.markEmailVerified(String(user._id));
    } else {
      await this.usersService.markPhoneVerified(String(user._id));
    }

    // Generate tokens
    const tokens = await this.generateTokens(String(user._id), user.email!, user.roles);

    // Get the updated user with all fields for response
    const updatedUser = await this.usersService.findById(String(user._id));
    const userData = plainToInstance(UserDataDto, updatedUser.toObject());

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userData,
      registrationState: user.registrationState,
      hasSecondaryContact: !missingContactType,
      missingContactType,
      secondaryContactNeedsVerification,
    };
  }

  async addSecondaryContact(
    userId: string,
    dto: AddSecondaryContactDto,
  ): Promise<AddSecondaryContactDataDto> {
    // Get the user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate the request
    if (dto.contactType === AuthMethod.EMAIL) {
      if (!dto.email) {
        throw new BadRequestException('Email is required when contactType is email');
      }
      if (user.email) {
        throw new ConflictException('User already has an email address');
      }

      // Check if email is already taken
      const existingUser = await this.usersService.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use by another account');
      }
    } else if (dto.contactType === AuthMethod.PHONE) {
      if (!dto.phone) {
        throw new BadRequestException('Phone is required when contactType is phone');
      }
      if (user.phone) {
        throw new ConflictException('User already has a phone number');
      }

      // Check if phone is already taken
      const existingUser = await this.usersService.findByPhone(dto.phone);
      if (existingUser) {
        throw new ConflictException('Phone already in use by another account');
      }
    } else {
      throw new BadRequestException('Invalid contact type');
    }

    // Update user with new contact info directly
    const identifier = dto.contactType === AuthMethod.EMAIL ? dto.email! : dto.phone!;

    // Use the user service to find and update the user
    const updatedUser = await this.usersService.findById(userId);
    if (dto.contactType === AuthMethod.EMAIL) {
      updatedUser.email = dto.email!;
    } else {
      updatedUser.phone = dto.phone!;
    }
    await updatedUser.save();

    // Send verification code for the new contact (direct OTP generation)
    const cfg = await this.loadOtpConfig();
    const code = OtpUtil.generate(cfg.length);
    const expiresAt = DateUtils.create(DateUtils.nowTimestamp() + cfg.ttlMs);

    // Store verification token for the new contact (use user field since user exists)
    const codeHash = await CryptoUtil.hashPassword(code);
    await this.vtModel
      .findOneAndUpdate(
        { user: user._id, type: dto.contactType },
        {
          codeHash,
          expiresAt,
          used: false,
          attempts: 0,
          lastSentAt: DateUtils.now(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    // Send OTP
    try {
      const canSend =
        (dto.contactType === AuthMethod.EMAIL && cfg.notifyEmailEnabled) ||
        (dto.contactType === AuthMethod.PHONE && cfg.notifySmsEnabled);

      if (canSend) {
        await this.notificationService.sendOtp(dto.contactType, identifier, code);
      }
    } catch {
      // In non-production, don't fail if sending fails - still return success with test code
      if (process.env.NODE_ENV === 'production') {
        // Clean up the verification token if sending fails in production
        await this.vtModel.deleteOne({ user: user._id, type: dto.contactType }).exec();
        throw new BadRequestException('Failed to send verification code');
      }
      // In development, continue with success response including test code
    }

    return {
      success: true,
      verificationRequired: true,
      codeDeliveryMethod:
        dto.contactType === AuthMethod.EMAIL ? CodeDeliveryMethod.EMAIL : CodeDeliveryMethod.SMS,
      testCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }
}
