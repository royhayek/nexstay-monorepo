import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../database/schemas/user.schema';

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: UserDocument }>();
  return request.user;
});
