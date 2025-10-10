import { applyDecorators, UseGuards, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { Public } from './public.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import {
  BadRequestResponseDto,
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  TooManyRequestsResponseDto,
  InternalServerErrorResponseDto,
} from '../dto/error-response.dto';

/**
 * Interface for API endpoint configuration
 */
interface ApiEndpointOptions {
  summary: string;
  description?: string;
  auth?: {
    required?: boolean;
    roles?: UserRole[];
  };
  responses?: {
    success?: {
      status?: number;
      description?: string;
      type?: string | Type<unknown>;
    };
    errors?: {
      badRequest?: string;
      unauthorized?: string;
      forbidden?: string;
      notFound?: string;
      internalError?: string;
    };
  };
  responseType?: Type<unknown>;
}

/**
 * Comprehensive decorator that combines authentication, authorization, and Swagger documentation
 *
 * @example
 * // Public endpoint with response type
 * @ApiEndpoint({
 *   summary: 'Get public data',
 *   auth: { required: false },
 *   responseType: PublicDataResponseDto
 * })
 *
 * @example
 * // Protected endpoint for admins only
 * @ApiEndpoint({
 *   summary: 'Delete user',
 *   description: 'System Admin and Admin-only operation to delete users',
 *   auth: {
 *     required: true,
 *     roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN]
 *   },
 *   responseType: UserDeletionResponseDto,
 *   responses: {
 *     success: { description: 'User deleted successfully' },
 *     errors: {
 *       forbidden: 'Insufficient permissions to delete users',
 *       notFound: 'User not found'
 *     }
 *   }
 * })
 *
 * @example
 * // Quick usage with convenience decorators
 * @ProtectedEndpoint('Get user profile', 'Retrieve current user profile', ['Users'], UserResponseDto)
 */
export function ApiEndpoint(options: ApiEndpointOptions) {
  const decorators = [
    // Add Swagger documentation
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  // Handle authentication and authorization
  if (options.auth?.required !== false) {
    decorators.push(ApiBearerAuth());
    decorators.push(UseGuards(JwtAuthGuard));

    // Add role-based authorization
    if (options.auth?.roles?.length) {
      decorators.push(UseGuards(RolesGuard));
      decorators.push(Roles(...options.auth.roles));
    }
  } else {
    // Mark as public endpoint
    decorators.push(Public());
  }

  // Add response documentation
  const successStatus = options.responses?.success?.status || 200;
  const ResponseDecorator = successStatus === 201 ? ApiCreatedResponse : ApiOkResponse;

  const responseConfig: {
    description: string;
    type?: string | Type<unknown>;
  } = {
    description: options.responses?.success?.description || 'Operation successful',
  };

  // Use responseType if provided, otherwise fall back to responses.success.type
  if (options.responseType) {
    responseConfig.type = options.responseType;
  } else if (options.responses?.success?.type) {
    responseConfig.type = options.responses.success.type;
  }

  decorators.push(ResponseDecorator(responseConfig));

  // Add error responses with proper DTOs
  const errors = options.responses?.errors;

  // Always add 400 Bad Request
  decorators.push(
    ApiBadRequestResponse({
      description: errors?.badRequest || 'Invalid request data',
      type: BadRequestResponseDto,
    }),
  );

  // Add 401 Unauthorized for protected endpoints
  if (options.auth?.required !== false) {
    decorators.push(
      ApiUnauthorizedResponse({
        description: errors?.unauthorized || 'Authentication required',
        type: UnauthorizedResponseDto,
      }),
    );

    // Add 403 Forbidden for role-protected endpoints
    if (options.auth?.roles?.length) {
      decorators.push(
        ApiForbiddenResponse({
          description: errors?.forbidden || 'Insufficient permissions',
          type: ForbiddenResponseDto,
        }),
      );
    }
  }

  // Add 404 Not Found if specified
  if (errors?.notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: errors.notFound,
        type: NotFoundResponseDto,
      }),
    );
  }

  // Always add 429 Too Many Requests (rate limiting)
  decorators.push(
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded',
      type: TooManyRequestsResponseDto,
    }),
  );

  // Always add 500 Internal Server Error
  decorators.push(
    ApiInternalServerErrorResponse({
      description: errors?.internalError || 'Internal server error',
      type: InternalServerErrorResponseDto,
    }),
  );

  return applyDecorators(...decorators);
}

/**
 * Quick decorator for public endpoints
 */
export function PublicEndpoint(
  summary: string,
  description?: string,
  responseType?: Type<unknown>,
) {
  return ApiEndpoint({
    summary,
    description,
    auth: { required: false },
    responseType,
  });
}

/**
 * Quick decorator for protected endpoints (authenticated users only)
 */
export function ProtectedEndpoint(
  summary: string,
  description?: string,
  responseType?: Type<unknown>,
) {
  return ApiEndpoint({
    summary,
    description,
    auth: { required: true },
    responseType,
  });
}

/**
 * Quick decorator for admin-only endpoints
 */
export function AdminEndpoint(summary: string, description?: string, responseType?: Type<unknown>) {
  return ApiEndpoint({
    summary,
    description,
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      errors: {
        forbidden: 'Admin access required',
      },
    },
    responseType,
  });
}
