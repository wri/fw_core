import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { IUser } from './user.model';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUser => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  },
);
