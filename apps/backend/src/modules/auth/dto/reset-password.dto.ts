import {
  IsTextAreaField,
  IsPasswordField,
} from '../../../common/validators/standardized-validators';

export class ResetPasswordDto {
  @IsTextAreaField({
    required: true,
    description: 'Temporary password reset token from verify-reset endpoint',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODk4M2FmNTRhNDcxYTBjZTYzMWRhMGMiLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQiLCJpYXQiOjE3NTQ4MDgwNTksImV4cCI6MTc1NDgwODk1OX0.CDe3Q_rVFfRtSiTdayHo69hP_g_Ytp_O-NpRANeZAn0',
  })
  resetToken!: string;

  @IsPasswordField({
    required: true,
    description: 'New password with strong requirements',
    example: 'NewP@ssw0rd123',
  })
  newPassword!: string;
}
