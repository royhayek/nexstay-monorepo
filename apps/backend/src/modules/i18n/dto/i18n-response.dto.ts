import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import type {
  LanguageInfo,
  CurrencyFormat,
  TranslationNamespace,
} from '../interfaces/i18n.interfaces';

export class TranslationDataDto {
  @ApiProperty({
    description: 'Current language code',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'Text direction for the language',
    enum: ['ltr', 'rtl'],
    example: 'ltr',
  })
  direction: 'ltr' | 'rtl';

  @ApiProperty({
    description: 'Date format for the language',
    example: 'MM/DD/YYYY',
    required: false,
  })
  dateFormat?: string;

  @ApiProperty({
    description: 'Currency format configuration',
    type: 'object',
    additionalProperties: true,
    example: { currency: 'USD', locale: 'en-US' },
  })
  currency?: CurrencyFormat;

  @ApiProperty({
    description: 'Translation data organized by namespace',
    type: 'object',
    additionalProperties: true,
    example: {
      common: { success: 'Success', error: 'Error' },
      auth: { login: { title: 'Sign In' } },
    },
  })
  translations: Record<string, TranslationNamespace>;
}

export class TranslationResponseDto extends BaseResponseDto<TranslationDataDto> {
  @ApiProperty({
    description: 'Translation data',
    type: TranslationDataDto,
  })
  declare data: TranslationDataDto;
}

export class NamespaceTranslationDataDto {
  @ApiProperty({
    description: 'Translation namespace',
    example: 'auth',
  })
  namespace: string;

  @ApiProperty({
    description: 'Language code',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'Translation data for the namespace',
    type: 'object',
    additionalProperties: true,
    example: {
      login: { title: 'Sign In', success: 'Login successful' },
    },
  })
  translations: TranslationNamespace;
}

export class NamespaceTranslationResponseDto extends BaseResponseDto<NamespaceTranslationDataDto> {
  @ApiProperty({
    description: 'Namespace translation data',
    type: NamespaceTranslationDataDto,
  })
  declare data: NamespaceTranslationDataDto;
}

export class SupportedLanguagesDataDto {
  @ApiProperty({
    description: 'Current active language code',
    example: 'en',
  })
  current: string;

  @ApiProperty({
    description: 'Default language code',
    example: 'en',
  })
  default: string;

  @ApiProperty({
    description: 'List of all supported languages with metadata',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'en' },
        name: { type: 'string', example: 'English' },
        direction: { type: 'string', enum: ['ltr', 'rtl'], example: 'ltr' },
      },
    },
    example: [
      { code: 'en', name: 'English', direction: 'ltr' },
      { code: 'fr', name: 'Français', direction: 'ltr' },
      { code: 'ar', name: 'العربية', direction: 'rtl' },
    ],
  })
  supported: LanguageInfo[];
}

export class SupportedLanguagesResponseDto extends BaseResponseDto<SupportedLanguagesDataDto> {
  @ApiProperty({
    description: 'Supported languages data',
    type: SupportedLanguagesDataDto,
  })
  declare data: SupportedLanguagesDataDto;
}

export class KeyTranslationDataDto {
  @ApiProperty({
    description: 'Translation key',
    example: 'auth.login.title',
  })
  key: string;

  @ApiProperty({
    description: 'Language code',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'Translated text',
    example: 'Sign In',
  })
  translation: string;
}

export class KeyTranslationResponseDto extends BaseResponseDto<KeyTranslationDataDto> {
  @ApiProperty({
    description: 'Key translation data',
    type: KeyTranslationDataDto,
  })
  declare data: KeyTranslationDataDto;
}

export class LanguageContextDataDto {
  @ApiProperty({
    description: 'Current language code',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'Text direction for the language',
    enum: ['ltr', 'rtl'],
    example: 'ltr',
  })
  direction: 'ltr' | 'rtl';

  @ApiProperty({
    description: 'Date format for the language',
    example: 'MM/DD/YYYY',
  })
  dateFormat: string;

  @ApiProperty({
    description: 'Currency format configuration',
    type: 'object',
    additionalProperties: true,
    example: { currency: 'USD', locale: 'en-US' },
  })
  currency: CurrencyFormat;

  @ApiProperty({
    description: 'Whether the language is supported',
    example: true,
  })
  isSupported: boolean;
}

export class LanguageContextResponseDto extends BaseResponseDto<LanguageContextDataDto> {
  @ApiProperty({
    description: 'Language context data',
    type: LanguageContextDataDto,
  })
  declare data: LanguageContextDataDto;
}
