import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import acceptLanguage from 'accept-language-parser';
import { I18nService } from '../../modules/i18n/i18n.service';

// Extend Request interface to include language properties
interface RequestWithLanguage extends Request {
  language?: string;
  languageDirection?: 'ltr' | 'rtl';
  cookies: { language?: string; [key: string]: string | undefined };
}

@Injectable()
export class LanguageDetectionMiddleware implements NestMiddleware {
  constructor(private readonly i18nService: I18nService) {}

  use(req: RequestWithLanguage, res: Response, next: NextFunction) {
    // Try to get language from various sources in order of preference
    let detectedLang: string | undefined;

    // 1. Query parameter (?lang=en)
    detectedLang = req.query.lang as string;

    // 2. Custom header (X-Language)
    if (!detectedLang) {
      detectedLang = req.headers['x-language'] as string;
    }

    // 3. Cookie
    if (!detectedLang) {
      detectedLang = req.cookies?.language;
    }

    // 4. Accept-Language header (browser preference)
    if (!detectedLang) {
      const acceptLanguageHeader = req.headers['accept-language'];
      if (acceptLanguageHeader && typeof acceptLanguageHeader === 'string') {
        const parsedLanguages = acceptLanguage.parse(acceptLanguageHeader);
        const supportedLanguages = this.i18nService.getSupportedLanguages();

        // Find the first matching supported language
        for (const lang of parsedLanguages) {
          const langCode = lang.code.toLowerCase();
          const langWithoutRegion = langCode.split('-')[0]; // Handle cases like 'en-US' -> 'en'

          if (supportedLanguages.includes(langCode)) {
            detectedLang = langCode;
            break;
          } else if (supportedLanguages.includes(langWithoutRegion)) {
            detectedLang = langWithoutRegion;
            break;
          }
        }
      }
    }

    // 5. Fallback to default language
    if (!detectedLang || !this.i18nService.isLanguageSupported(detectedLang)) {
      detectedLang = this.i18nService.getDefaultLanguage();
    }

    // Set the detected language in request for later use
    req.language = detectedLang;
    req.languageDirection = this.i18nService.getLanguageDirection(detectedLang);

    // Set response headers for client-side usage
    res.setHeader('Content-Language', detectedLang);
    res.setHeader('X-Language-Direction', this.i18nService.getLanguageDirection(detectedLang));
    res.setHeader('X-Supported-Languages', this.i18nService.getSupportedLanguages().join(','));

    // Set cookie if language was detected from Accept-Language header
    // This helps maintain language preference for subsequent requests
    if (!req.cookies?.language && detectedLang !== this.i18nService.getDefaultLanguage()) {
      res.cookie('language', detectedLang, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    next();
  }
}
