import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

/**
 * Base error response DTO for all error responses
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Operation status',
    example: 'error',
    enum: ['error'],
  })
  status: 'error';

  @ApiProperty({
    description: 'Error title',
    example: 'Authentication Failed',
  })
  title: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid credentials provided',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error code for client-side handling',
    example: 'UNAUTHORIZED',
    required: false,
  })
  errorCode?: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/v1/users/profile',
    required: false,
  })
  path?: string;

  @ApiProperty({
    description: 'Request timestamp',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Additional error details',
    required: false,
  })
  details?: any;
}

/**
 * 400 Bad Request
 */
export class BadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.BAD_REQUEST,
  })
  statusCode: number = HttpStatus.BAD_REQUEST;

  @ApiProperty({
    description: 'Error title',
    example: 'Bad Request',
  })
  title: string = 'Bad Request';

  @ApiProperty({
    description: 'Error message',
    example: 'The request contains invalid data',
  })
  message: string = 'The request contains invalid data';

  @ApiProperty({
    description: 'Validation errors',
    example: [
      { field: 'email', message: 'Email must be a valid email address' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ],
    required: false,
  })
  validationErrors?: Array<{ field: string; message: string }>;
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.UNAUTHORIZED,
  })
  statusCode: number = HttpStatus.UNAUTHORIZED;

  @ApiProperty({
    description: 'Error title',
    example: 'Unauthorized',
  })
  title: string = 'Unauthorized';

  @ApiProperty({
    description: 'Error message',
    example: 'Authentication is required to access this resource',
  })
  message: string = 'Authentication is required to access this resource';

  @ApiProperty({
    description: 'Error code',
    example: 'UNAUTHORIZED',
  })
  errorCode: string = 'UNAUTHORIZED';
}

/**
 * 403 Forbidden
 */
export class ForbiddenResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.FORBIDDEN,
  })
  statusCode: number = HttpStatus.FORBIDDEN;

  @ApiProperty({
    description: 'Error title',
    example: 'Forbidden',
  })
  title: string = 'Forbidden';

  @ApiProperty({
    description: 'Error message',
    example: 'You do not have permission to access this resource',
  })
  message: string = 'You do not have permission to access this resource';

  @ApiProperty({
    description: 'Error code',
    example: 'FORBIDDEN',
  })
  errorCode: string = 'FORBIDDEN';

  @ApiProperty({
    description: 'Required roles',
    example: ['ADMIN', 'MODERATOR'],
    required: false,
  })
  requiredRoles?: string[];
}

/**
 * 404 Not Found
 */
export class NotFoundResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.NOT_FOUND,
  })
  statusCode: number = HttpStatus.NOT_FOUND;

  @ApiProperty({
    description: 'Error title',
    example: 'Not Found',
  })
  title: string = 'Not Found';

  @ApiProperty({
    description: 'Error message',
    example: 'The requested resource was not found',
  })
  message: string = 'The requested resource was not found';

  @ApiProperty({
    description: 'Error code',
    example: 'NOT_FOUND',
  })
  errorCode: string = 'NOT_FOUND';

  @ApiProperty({
    description: 'Resource type',
    example: 'Property',
    required: false,
  })
  resourceType?: string;

  @ApiProperty({
    description: 'Resource ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  resourceId?: string;
}

/**
 * 409 Conflict
 */
export class ConflictResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.CONFLICT,
  })
  statusCode: number = HttpStatus.CONFLICT;

  @ApiProperty({
    description: 'Error title',
    example: 'Conflict',
  })
  title: string = 'Conflict';

  @ApiProperty({
    description: 'Error message',
    example: 'The request conflicts with the current state of the resource',
  })
  message: string = 'The request conflicts with the current state of the resource';

  @ApiProperty({
    description: 'Error code',
    example: 'CONFLICT',
  })
  errorCode: string = 'CONFLICT';

  @ApiProperty({
    description: 'Conflict type',
    example: 'DUPLICATE_EMAIL',
    required: false,
  })
  conflictType?: string;
}

/**
 * 422 Unprocessable Entity
 */
export class UnprocessableEntityResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.UNPROCESSABLE_ENTITY,
  })
  statusCode: number = HttpStatus.UNPROCESSABLE_ENTITY;

  @ApiProperty({
    description: 'Error title',
    example: 'Unprocessable Entity',
  })
  title: string = 'Unprocessable Entity';

  @ApiProperty({
    description: 'Error message',
    example: 'The request was well-formed but contains semantic errors',
  })
  message: string = 'The request was well-formed but contains semantic errors';

  @ApiProperty({
    description: 'Validation errors',
    example: [
      { field: 'checkIn', message: 'Check-in date must be in the future' },
      { field: 'checkOut', message: 'Check-out date must be after check-in date' },
    ],
    required: false,
  })
  validationErrors?: Array<{ field: string; message: string }>;
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.TOO_MANY_REQUESTS,
  })
  statusCode: number = HttpStatus.TOO_MANY_REQUESTS;

  @ApiProperty({
    description: 'Error title',
    example: 'Too Many Requests',
  })
  title: string = 'Too Many Requests';

  @ApiProperty({
    description: 'Error message',
    example: 'Rate limit exceeded. Please try again later',
  })
  message: string = 'Rate limit exceeded. Please try again later';

  @ApiProperty({
    description: 'Error code',
    example: 'RATE_LIMIT_EXCEEDED',
  })
  errorCode: string = 'RATE_LIMIT_EXCEEDED';

  @ApiProperty({
    description: 'Retry after (seconds)',
    example: 60,
    required: false,
  })
  retryAfter?: number;

  @ApiProperty({
    description: 'Rate limit details',
    example: {
      limit: 100,
      remaining: 0,
      resetTime: '2024-01-15T11:00:00.000Z',
    },
    required: false,
  })
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: string;
  };
}

/**
 * 500 Internal Server Error
 */
export class InternalServerErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.INTERNAL_SERVER_ERROR,
  })
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;

  @ApiProperty({
    description: 'Error title',
    example: 'Internal Server Error',
  })
  title: string = 'Internal Server Error';

  @ApiProperty({
    description: 'Error message',
    example: 'An unexpected error occurred. Please try again later',
  })
  message: string = 'An unexpected error occurred. Please try again later';

  @ApiProperty({
    description: 'Error code',
    example: 'INTERNAL_ERROR',
  })
  errorCode: string = 'INTERNAL_ERROR';

  @ApiProperty({
    description: 'Error tracking ID',
    example: 'err_507f1f77bcf86cd799439011',
    required: false,
  })
  errorId?: string;
}

/**
 * 502 Bad Gateway
 */
export class BadGatewayResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.BAD_GATEWAY,
  })
  statusCode: number = HttpStatus.BAD_GATEWAY;

  @ApiProperty({
    description: 'Error title',
    example: 'Bad Gateway',
  })
  title: string = 'Bad Gateway';

  @ApiProperty({
    description: 'Error message',
    example: 'The upstream service is unavailable',
  })
  message: string = 'The upstream service is unavailable';

  @ApiProperty({
    description: 'Service name',
    example: 'payment-service',
    required: false,
  })
  service?: string;
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.SERVICE_UNAVAILABLE,
  })
  statusCode: number = HttpStatus.SERVICE_UNAVAILABLE;

  @ApiProperty({
    description: 'Error title',
    example: 'Service Unavailable',
  })
  title: string = 'Service Unavailable';

  @ApiProperty({
    description: 'Error message',
    example: 'The service is temporarily unavailable. Please try again later',
  })
  message: string = 'The service is temporarily unavailable. Please try again later';

  @ApiProperty({
    description: 'Retry after (seconds)',
    example: 300,
    required: false,
  })
  retryAfter?: number;

  @ApiProperty({
    description: 'Maintenance mode',
    example: true,
    required: false,
  })
  maintenanceMode?: boolean;
}
