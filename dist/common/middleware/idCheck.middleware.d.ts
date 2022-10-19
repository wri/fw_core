import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UserService } from "../user.service";
export declare class IdCheckMiddleware implements NestMiddleware {
    private readonly userService;
    constructor(userService: UserService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
