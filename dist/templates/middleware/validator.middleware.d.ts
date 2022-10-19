import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
export declare class CreateTemplateMiddleware implements NestMiddleware {
    constructor();
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
