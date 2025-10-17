import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthPublicController } from './controllers/auth-public.controller';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';
import { RefreshToken, RefreshTokenSchema } from '../../database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenSchema,
} from '../../database/schemas/verification-token.schema';
import { TrustedDevice, TrustedDeviceSchema } from '../../database/schemas/trusted-device.schema';
import { AuditLog, AuditLogSchema } from '../../database/schemas/audit-log.schema';
import { IsOtpCodeConstraint } from '../../common/validators/otp-code.validator';
import { DynamicConfigModule } from '../config/config.module';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogCleanupService } from './services/audit-log-cleanup.service';
import { TrustedDeviceCleanupService } from './services/trusted-device-cleanup.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: VerificationToken.name, schema: VerificationTokenSchema },
      { name: TrustedDevice.name, schema: TrustedDeviceSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET', 'fallbackSecret'),
        signOptions: { expiresIn: cs.get<string>('JWT_EXPIRES_IN', '15m') as any },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    UsersModule,
    DynamicConfigModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AuthPublicController],
  providers: [
    AuthService,
    JwtStrategy,
    IsOtpCodeConstraint,
    AuditLogService,
    AuditLogCleanupService,
    TrustedDeviceCleanupService,
  ],
  exports: [AuthService, AuditLogService, TrustedDeviceCleanupService],
})
export class AuthModule {}
