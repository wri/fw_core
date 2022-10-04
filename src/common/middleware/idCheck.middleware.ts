import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { UserService } from "../user.service"

@Injectable()
export class IdCheckMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) { }

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.params.id) {
      const objId = new mongoose.Types.ObjectId(req.params.id)
      const strId = objId.toString()
      if(req.params.id === strId) throw new HttpException("ids must be valid object ids", HttpStatus.BAD_REQUEST)
    }
    next();
  }
}