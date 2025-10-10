import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthPublicController } from './controllers/auth-public.controller';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.modules';
import { RefreshToken, RefreshTokenSchema } from '../../database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenSchema,
} from '../../database/schemas/verification-token.schema';
import { IsOtpCodeConstraint } from '../../common/validators/otp-code.validator';
import { DynamicConfigModule } from '../config/config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: VerificationToken.name, schema: VerificationTokenSchema },
    ]),
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET', 'fallbackSecret'),
        signOptions: { expiresIn: cs.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    UsersModule,
    DynamicConfigModule,
  ],
  controllers: [AuthPublicController],
  providers: [AuthService, JwtStrategy, IsOtpCodeConstraint],
  exports: [AuthService],
})
export class AuthModule {}
