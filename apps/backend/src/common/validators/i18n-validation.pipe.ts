import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { I18nService } from '../../modules/i18n/i18n.service';
import { TRANSLATION_KEYS } from '../constants/translation-keys';

@Injectable()
export class I18nValidationPipe implements PipeTransform {
  constructor(private readonly i18nService: I18nService) {}

  async transform(
    value: Record<string, unknown>,
    metadata: ArgumentMetadata,
  ): Promise<Record<string, unknown>> {
    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value) as object;
    const errors = await validate(object);

    if (errors.length > 0) {
      const translatedErrors = this.translateValidationErrors(errors);
      throw new BadRequestException({
        message: this.i18nService.translate(TRANSLATION_KEYS.COMMON.MESSAGES.BAD_REQUEST),
        errors: translatedErrors,
      });
    }

    return value;
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: Array<new (...args: unknown[]) => unknown> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }

  private translateValidationErrors(errors: ValidationError[]): Array<{
    property: string;
    value: unknown;
    constraints: Record<string, string>;
    children?: Array<{
      property: string;
      value: unknown;
      constraints: Record<string, string>;
    }>;
  }> {
    return errors.map((error) => {
      const translatedConstraints: Record<string, string> = {};

      if (error.constraints) {
        for (const [key, message] of Object.entries(error.constraints)) {
          // Try to translate common validation messages
          const translatedMessage = this.translateConstraintMessage(key, message, error);
          translatedConstraints[key] = translatedMessage;
        }
      }

      const result: {
        property: string;
        value: unknown;
        constraints: Record<string, string>;
        children?: Array<{
          property: string;
          value: unknown;
          constraints: Record<string, string>;
        }>;
      } = {
        property: error.property || '',
        value: error.value,
        constraints: translatedConstraints,
      };

      if (error.children) {
        result.children = this.translateValidationErrors(error.children);
      }

      return result;
    });
  }

  private translateConstraintMessage(
    constraintType: string,
    originalMessage: string,
    error: ValidationError,
  ): string {
    const currentLang = this.i18nService.getCurrentLanguage();

    // Map constraint types to translation keys
    const constraintTranslations: { [key: string]: string } = {
      isNotEmpty: TRANSLATION_KEYS.COMMON.VALIDATION.REQUIRED,
      isEmail: TRANSLATION_KEYS.COMMON.VALIDATION.EMAIL,
      isString: TRANSLATION_KEYS.COMMON.VALIDATION.IS_STRING,
      isNumber: TRANSLATION_KEYS.COMMON.VALIDATION.IS_NUMBER,
      isBoolean: TRANSLATION_KEYS.COMMON.VALIDATION.IS_BOOLEAN,
      isArray: TRANSLATION_KEYS.COMMON.VALIDATION.IS_ARRAY,
      isEnum: TRANSLATION_KEYS.COMMON.VALIDATION.IS_ENUM,
      minLength: TRANSLATION_KEYS.COMMON.VALIDATION.MIN_LENGTH,
      maxLength: TRANSLATION_KEYS.COMMON.VALIDATION.MAX_LENGTH,
      min: TRANSLATION_KEYS.COMMON.VALIDATION.MIN,
      max: TRANSLATION_KEYS.COMMON.VALIDATION.MAX,
    };

    const translationKey = constraintTranslations[constraintType];

    if (translationKey) {
      // Extract constraint values for interpolation
      const args = this.extractConstraintArgs(constraintType, error);

      return this.i18nService.translate(translationKey, {
        args,
        lang: currentLang,
        defaultValue: originalMessage,
      });
    }

    // For custom validation messages or unknown constraints, try field-specific translations
    if (error.property) {
      const fieldTranslationKey = `validation.${error.property}.${constraintType}`;
      const fieldTranslation = this.i18nService.translate(fieldTranslationKey, {
        lang: currentLang,
        defaultValue: originalMessage,
      });

      // If we got a translation (not just the key back), use it
      if (fieldTranslation !== fieldTranslationKey) {
        return fieldTranslation;
      }
    }

    // Fallback to original message
    return originalMessage;
  }

  private extractConstraintArgs(
    constraintType: string,
    error: ValidationError,
  ): Record<string, string | number> {
    const args: Record<string, string | number> = {};

    // Extract common constraint arguments
    switch (constraintType) {
      case 'minLength':
        if (error.constraints?.minLength) {
          const match = error.constraints.minLength.match(/(\d+)/);
          if (match?.[1]) {
            args.min = parseInt(match[1], 10);
          }
        }
        break;

      case 'maxLength':
        if (error.constraints?.maxLength) {
          const match = error.constraints.maxLength.match(/(\d+)/);
          if (match?.[1]) {
            args.max = parseInt(match[1], 10);
          }
        }
        break;

      case 'min':
        if (error.constraints?.min) {
          const match = error.constraints.min.match(/(\d+)/);
          if (match?.[1]) {
            args.min = parseInt(match[1], 10);
          }
        }
        break;

      case 'max':
        if (error.constraints?.max) {
          const match = error.constraints.max.match(/(\d+)/);
          if (match?.[1]) {
            args.max = parseInt(match[1], 10);
          }
        }
        break;

      case 'isEnum':
        // For enum constraints, try to extract valid values
        if (error.constraints?.isEnum) {
          const match = error.constraints.isEnum.match(/valid values are (.+)/);
          if (match?.[1]) {
            args.values = match[1];
          }
        }
        break;
    }

    return args;
  }
}
