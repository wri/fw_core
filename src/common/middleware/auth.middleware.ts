import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization)
      throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
    const userData = await this.userService.authorise(
      req.headers.authorization,
    );
    if (!userData && !userData.id)
      throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
    userData.token = req.headers.authorization;
    const username = await this.userService.getNameByIdMICROSERVICE(
      userData.id,
    );
    userData.name = username;
    req.user = userData;
    next();
  }
}
