import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = unknown> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: T;

  constructor(data: T, message: string) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}
