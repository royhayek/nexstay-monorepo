import { IsIdentifierField } from '../../../common/validators/standardized-validators';

export class CheckIdentifierDto {
  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number to check',
    example: 'alice@example.com',
  })
  identifier!: string;
}
