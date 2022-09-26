import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service"

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly userService: UserService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        if(!req.headers.authorization) throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
        const userData = await this.userService.authorise(req.headers.authorization);
        if(!userData && !userData.id) throw new HttpException('Unauthorised', HttpStatus.UNAUTHORIZED);
        userData.token = req.headers.authorization;
        if (["GET", "DELETE"].includes(req.method.toUpperCase())) {
            req.query = {
              ...req.query,
              loggedUser: JSON.stringify(userData)
            };
            req.user = userData;
          } else if (["POST", "PATCH", "PUT"].includes(req.method.toUpperCase())) {
            req.body.loggedUser = userData;
            req.user = userData;
          }
        next();
    }
}