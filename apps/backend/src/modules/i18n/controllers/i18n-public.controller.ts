import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { I18nService } from '../i18n.service';
import { LanguageInfo } from '../interfaces/i18n.interfaces';
import {
  TranslationResponseDto,
  NamespaceTranslationResponseDto,
  SupportedLanguagesResponseDto,
  KeyTranslationResponseDto,
  LanguageContextResponseDto,
} from '../dto/i18n-response.dto';

/**
 * Public Controller for Internationalization
 * Handles public access to translation data without authentication
 */
@Controller('public/i18n')
@ApiTags('Internationalization (Public)')
export class I18nPublicController extends BaseController {
  constructor(private readonly translationService: I18nService) {
    super();
  }

  @Get('translations')
  @PublicEndpoint(
    'Get all translations for current language',
    'Retrieve all translation keys and values for the current or specified language',
  )
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, fr, ar)',
    example: 'en',
  })
  async getAllTranslations(@Query('lang') lang?: string): Promise<TranslationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const currentLang = lang || this.translationService.getCurrentLanguage();

        // Get translations for main namespaces
        const [common, auth] = await Promise.all([
          this.translationService.getTranslations('common', currentLang),
          this.translationService.getTranslations('auth', currentLang),
        ]);

        return {
          language: currentLang,
          direction: this.translationService.getLanguageDirection(currentLang),
          dateFormat: this.translationService.getDateFormat(currentLang),
          currency: this.translationService.getCurrencyFormat(currentLang),
          translations: {
            common,
            auth,
          },
        };
      },
      'Get all translations',
      'Translations Retrieved',
      'Translation data retrieved successfully',
      'Failed to retrieve translation data',
    );
  }

  @Get('translations/:namespace')
  @PublicEndpoint(
    'Get translations for a specific namespace',
    'Retrieve translation keys and values for a specific namespace (e.g., auth, common)',
  )
  @ApiParam({
    name: 'namespace',
    description: 'Translation namespace (common, auth, etc.)',
    example: 'auth',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, fr, ar)',
    example: 'en',
  })
  async getNamespaceTranslations(
    @Param('namespace') namespace: string,
    @Query('lang') lang?: string,
  ): Promise<NamespaceTranslationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const currentLang = lang || this.translationService.getCurrentLanguage();
        const translations = await this.translationService.getTranslations(namespace, currentLang);

        return {
          namespace,
          language: currentLang,
          translations,
        };
      },
      'Get namespace translations',
      'Namespace Translations Retrieved',
      'Namespace translations retrieved successfully',
      'Failed to retrieve namespace translations',
    );
  }

  @Get('languages')
  @PublicEndpoint(
    'Get supported languages',
    'Retrieve list of all supported languages with their metadata',
  )
  async getSupportedLanguages(): Promise<SupportedLanguagesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        const supportedLanguages = this.translationService.getSupportedLanguages();
        const languageNames: Record<string, string> = {
          en: 'English',
          fr: 'Français',
          ar: 'العربية',
        };

        const languages: LanguageInfo[] = supportedLanguages.map((code) => ({
          code,
          name: languageNames[code] || code,
          direction: this.translationService.getLanguageDirection(code),
        }));

        return {
          current: this.translationService.getCurrentLanguage(),
          default: this.translationService.getDefaultLanguage(),
          supported: languages,
        };
      },
      'Get supported languages',
      'Supported Languages Retrieved',
      'Supported languages retrieved successfully',
      'Failed to retrieve supported languages',
    );
  }

  @Get('translate/:key')
  @PublicEndpoint(
    'Translate a specific key',
    'Get translation for a specific key with optional language override',
  )
  @ApiParam({
    name: 'key',
    description: 'Translation key (e.g., auth.login.title)',
    example: 'auth.login.title',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, fr, ar)',
    example: 'en',
  })
  async translateKey(
    @Param('key') key: string,
    @Query('lang') lang?: string,
  ): Promise<KeyTranslationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        const currentLang = lang || this.translationService.getCurrentLanguage();
        const translation = this.translationService.translateFor(key, currentLang);

        return {
          key,
          language: currentLang,
          translation,
        };
      },
      'Translate key',
      'Translation Retrieved',
      'Translation retrieved successfully',
      'Failed to retrieve translation',
    );
  }

  @Get('context')
  @PublicEndpoint('Get current language context', 'Retrieve current language context information')
  async getLanguageContext(): Promise<LanguageContextResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        const currentLang = this.translationService.getCurrentLanguage();

        return {
          language: currentLang,
          direction: this.translationService.getLanguageDirection(currentLang),
          dateFormat: this.translationService.getDateFormat(currentLang),
          currency: this.translationService.getCurrencyFormat(currentLang),
          isSupported: this.translationService.isLanguageSupported(currentLang),
        };
      },
      'Get language context',
      'Language Context Retrieved',
      'Language context retrieved successfully',
      'Failed to retrieve language context',
    );
  }
}
