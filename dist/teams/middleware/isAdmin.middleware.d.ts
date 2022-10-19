import { NestMiddleware } from "@nestjs/common";
import { Model } from 'mongoose';
import { Request, Response, NextFunction } from "express";
import { TeamMembersService } from "../services/teamMembers.service";
import { TeamMemberDocument } from '../models/teamMember.schema';
import { TeamDocument } from "../models/team.schema";
export declare class IsAdminMiddleware implements NestMiddleware {
    private readonly teamMembersService;
    private teamMemberModel;
    private teamModel;
    constructor(teamMembersService: TeamMembersService, teamMemberModel: Model<TeamMemberDocument>, teamModel: Model<TeamDocument>);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
