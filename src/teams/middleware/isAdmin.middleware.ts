import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { TeamMembersService } from '../services/teamMembers.service';
import { EMemberRole, TeamMemberDocument } from '../models/teamMember.schema';
import { TeamDocument } from '../models/team.schema';
import mongoose from 'mongoose';

@Injectable()
export class IsAdminMiddleware implements NestMiddleware {
  constructor(
    private readonly teamMembersService: TeamMembersService,
    @InjectModel('teamuserrelations', 'teamsDb')
    private teamMemberModel: Model<TeamMemberDocument>,
    @InjectModel('gfwteams', 'teamsDb') private teamModel: Model<TeamDocument>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { teamId } = req.params;
    const { user } = req;
    const { id: userId } = user; // ToDo: loggedUser Type

    // ToDo: move this to a new middleware
    const numOfTeams = await this.teamModel.count({ _id: teamId });
    if (numOfTeams === 0)
      throw new HttpException(
        `Team not found with id: ${teamId}`,
        HttpStatus.NOT_FOUND,
      );

    const teamMember = await this.teamMembersService.findTeamMember(
      new mongoose.Types.ObjectId(teamId),
      new mongoose.Types.ObjectId(userId),
    );

    if (teamMember && teamMember.role === EMemberRole.Administrator) {
      await next();
    } else
      throw new HttpException(
        'Authenticated User must be the Administrator of the team',
        HttpStatus.FORBIDDEN,
      );
  }
}
