import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DynamicConfigService } from '../../modules/config/config.service';

@ValidatorConstraint({ name: 'IsOtpCode', async: true })
@Injectable()
export class IsOtpCodeConstraint implements ValidatorConstraintInterface {
  private lastLen = 6;
  private cache?: { len: number; until: number };

  constructor(private readonly config: DynamicConfigService) {}

  private async getLength(): Promise<number> {
    const now = Date.now();
    if (this.cache && now < this.cache.until) return this.cache.len;

    const len = await this.config.getNumber('OTP_LENGTH', 6);
    this.cache = { len, until: now + 60_000 }; // cache 60s to avoid frequent DB hits
    return len;
  }

  async validate(value: any): Promise<boolean> {
    if (typeof value !== 'string') return false;
    const len = await this.getLength();
    this.lastLen = len;
    const re = new RegExp(`^\\d{${len}}$`);
    return re.test(value);
  }

  defaultMessage(_: ValidationArguments): string {
    return `Code must be exactly ${this.lastLen}-digits and numeric`;
  }
}

export function IsOtpCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsOtpCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsOtpCodeConstraint,
    });
  };
}
