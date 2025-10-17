import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { ReviewTranslationDataDto, TranslationDto } from '../dto/review-enhancements.dto';
import { ReviewNotFoundException } from '../exceptions/review.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Review Translation Service
 * Handles review translation to multiple languages
 *
 * NOTE: This is a mock implementation that simulates translation.
 * In production, integrate with AWS Translate, Google Cloud Translation API,
 * or similar translation service.
 */
@Injectable()
export class ReviewTranslationService {
  private readonly SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];

  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>) {}

  /**
   * Translate a review to target language
   */
  async translateReview(
    reviewId: string,
    targetLanguage: string,
  ): Promise<ReviewTranslationDataDto> {
    try {
      ValidationUtils.validateObjectId(reviewId, 'reviewId', {
        context: 'ReviewTranslationService',
      });

      // Validate target language
      if (!this.SUPPORTED_LANGUAGES.includes(targetLanguage)) {
        throw new BadRequestException(
          `Unsupported language: ${targetLanguage}. Supported: ${this.SUPPORTED_LANGUAGES.join(', ')}`,
        );
      }

      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review) {
        throw new ReviewNotFoundException(reviewId);
      }

      if (!review.publicReview) {
        throw new BadRequestException('Review has no content to translate');
      }

      const originalLanguage = review.originalLanguage || 'en';

      // Check if translation already exists in cache
      if (review.translations && review.translations.has(targetLanguage)) {
        const cachedTranslation = review.translations.get(targetLanguage);
        LoggingUtil.log(
          `Using cached translation for review: ${reviewId} (${targetLanguage})`,
          'ReviewTranslationService',
        );

        return {
          originalLanguage,
          targetLanguage,
          translatedText: cachedTranslation!.publicReview,
          fromCache: true,
        };
      }

      // If source and target language are the same, return original text
      if (originalLanguage === targetLanguage) {
        return {
          originalLanguage,
          targetLanguage,
          translatedText: review.publicReview,
          fromCache: false,
        };
      }

      // Perform translation (mock implementation)
      const translatedText = await this.performTranslation(
        review.publicReview,
        originalLanguage,
        targetLanguage,
      );

      // Cache the translation
      if (!review.translations) {
        review.translations = new Map();
      }

      review.translations.set(targetLanguage, {
        publicReview: translatedText,
        translatedAt: DateUtils.now(),
        autoTranslated: true,
      });

      review.updatedAt = DateUtils.now();
      await review.save();

      LoggingUtil.log(
        `Translated review: ${reviewId} to ${targetLanguage}`,
        'ReviewTranslationService',
      );

      return {
        originalLanguage,
        targetLanguage,
        translatedText,
        fromCache: false,
      };
    } catch (error) {
      LoggingUtil.errorWithException(`Error translating review:`, error, 'ReviewTranslationService');
      throw error;
    }
  }

  /**
   * Get all available translations for a review
   */
  async getTranslations(reviewId: string): Promise<Record<string, TranslationDto>> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewTranslationService',
    });

    const review = await this.reviewModel.findById(reviewId).select('translations').lean().exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    if (!review.translations) {
      return {};
    }

    // Convert Map to plain object for API response
    const translations: Record<string, TranslationDto> = {};

    if (review.translations instanceof Map) {
      review.translations.forEach((value, key) => {
        translations[key] = value;
      });
    } else if (review.translations) {
      // When using lean(), Map becomes a plain object
      Object.entries(review.translations).forEach(([key, value]) => {
        translations[key] = value as TranslationDto;
      });
    }

    return translations;
  }

  /**
   * Clear translation cache for a review
   */
  async clearTranslations(reviewId: string): Promise<void> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewTranslationService',
    });

    await this.reviewModel
      .findByIdAndUpdate(reviewId, {
        $unset: { translations: '' },
        updatedAt: DateUtils.now(),
      })
      .exec();

    LoggingUtil.log(
      `Cleared translations for review: ${reviewId}`,
      'ReviewTranslationService',
    );
  }

  /**
   * Private helper methods
   */

  /**
   * Perform actual translation using external service
   * This is a MOCK implementation - replace with real translation service
   *
   * Production options:
   * - AWS Translate: https://aws.amazon.com/translate/
   * - Google Cloud Translation API: https://cloud.google.com/translate
   * - Microsoft Translator: https://azure.microsoft.com/en-us/services/cognitive-services/translator/
   * - DeepL API: https://www.deepl.com/pro-api
   */
  private async performTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    LoggingUtil.log(
      `[MOCK] Translating from ${sourceLanguage} to ${targetLanguage}`,
      'ReviewTranslationService',
    );

    // MOCK IMPLEMENTATION - Replace with actual translation API
    // This simply returns the original text with a prefix for demonstration
    const mockTranslations: Record<string, Record<string, string>> = {
      en: {
        fr: '[FR] ',
        ar: '[AR] ',
      },
      fr: {
        en: '[EN] ',
        ar: '[AR] ',
      },
      ar: {
        en: '[EN] ',
        fr: '[FR] ',
      },
    };

    const prefix = mockTranslations[sourceLanguage]?.[targetLanguage] || '[TRANSLATED] ';

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return `${prefix}${text}`;

    /**
     * PRODUCTION IMPLEMENTATION EXAMPLE (AWS Translate):
     *
     * import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
     *
     * const translateClient = new TranslateClient({ region: 'us-east-1' });
     *
     * const command = new TranslateTextCommand({
     *   Text: text,
     *   SourceLanguageCode: sourceLanguage,
     *   TargetLanguageCode: targetLanguage,
     * });
     *
     * const response = await translateClient.send(command);
     * return response.TranslatedText || text;
     */
  }

  /**
   * Detect language of text (mock implementation)
   * In production, use AWS Comprehend or Google Cloud Translation API
   */
  async detectLanguage(text: string): Promise<string> {
    // MOCK IMPLEMENTATION
    // In production, integrate with AWS Comprehend or similar service
    LoggingUtil.log('[MOCK] Detecting language', 'ReviewTranslationService');

    // Simple heuristic: if text contains Arabic characters, it's Arabic
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ar';
    }

    // Default to English
    return 'en';
  }
}
