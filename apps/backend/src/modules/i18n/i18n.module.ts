import * as path from 'path';

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CookieResolver, I18nModule as NestI18nModule, QueryResolver } from 'nestjs-i18n';
import { AcceptLanguageResolver } from 'nestjs-i18n/dist/resolvers/accept-language.resolver';

import { I18nPublicController } from './controllers/i18n-public.controller';
import { I18nService } from './i18n.service';

@Global()
@Module({
  imports: [
    NestI18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';
        const i18nPath = isDevelopment
          ? path.join(process.cwd(), 'src', 'i18n') // Development: use source files
          : path.join(__dirname, '../../i18n'); // Production: use built files

        return {
          fallbackLanguage: configService.get<string>('i18n.fallbackLanguage', 'en'),
          loaderOptions: {
            path: i18nPath,
            watch: isDevelopment,
          },
        };
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        { use: CookieResolver, options: ['language'] },
        new AcceptLanguageResolver(),
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  controllers: [I18nPublicController],
  providers: [I18nService],
  exports: [I18nService, NestI18nModule],
})
export class I18nModule {}
