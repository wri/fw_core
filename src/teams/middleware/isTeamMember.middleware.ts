import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response, NextFunction } from "express";
import { TeamMembersService } from "../services/teamMembers.service";
import { EMemberRole, TeamMember, TeamMemberDocument } from '../models/teamMember.schema';
import { Team, TeamDocument } from "../models/team.schema";

type TRequest = {
  body: {
    loggedUser: any;
  };
  query: any;
} & Request;

type TParams = {
  teamId: string;
};

@Injectable()
export class IsTeamMemberMiddleware implements NestMiddleware {
  constructor(
    private readonly teamMembersService: TeamMembersService,
    @InjectModel(TeamMember.name) private teamMemberModel: Model<TeamMemberDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const { teamId } = <TParams>req.params;
    const { body, query } = <TRequest>req;
    const { id: userId } = body.loggedUser || JSON.parse(query.loggedUser); // ToDo: loggedUser Type

    // ToDo: move this to a new middleware
    const numOfTeams = await this.teamModel.count({ _id: teamId });
    if (numOfTeams === 0) throw new HttpException(`Team not found with id: ${teamId}`, HttpStatus.NOT_FOUND);

    const teamMember = await this.teamMembersService.findTeamMember(teamId, userId);
    if (!teamMember || teamMember.role === EMemberRole.Left) throw new HttpException("Authenticated User must be the Administrator or Manager of the team", HttpStatus.FORBIDDEN);
    else await next();
  }
};