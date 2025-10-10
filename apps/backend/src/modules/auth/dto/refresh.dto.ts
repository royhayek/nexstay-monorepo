import { IsIdentifierField } from '../../../common/validators/standardized-validators';

export class RefreshDto {
  @IsIdentifierField({
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;
}
