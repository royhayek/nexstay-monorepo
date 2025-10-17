import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { LoggingUtil } from '../utils/logging.util';

interface AuthenticatedUser {
  id: string;
  roles: UserRole[];
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      LoggingUtil.warn('RolesGuard: No user found in request', 'RolesGuard');
      return false;
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      LoggingUtil.warn(`RolesGuard: User ${user.id} has invalid roles array`, 'RolesGuard');
      return false;
    }

    // SYSTEM_ADMIN has access to everything (superuser privilege)
    if (user.roles.includes(UserRole.SYSTEM_ADMIN)) {
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      LoggingUtil.warn(
        `RolesGuard: User ${user.id} with roles [${user.roles.join(', ')}] lacks required roles [${requiredRoles.join(', ')}]`,
        'RolesGuard',
      );
    }

    return hasRequiredRole;
  }
}
