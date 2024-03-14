import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { EMemberRole } from '../../teams/models/teamMember.schema';
import { TemplatesService } from '../../templates/templates.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import { TeamsService } from '../../teams/services/teams.service';
import { MongooseObjectId } from '../../common/objectId';
import { TemplateDocument } from '../../templates/models/template.schema';

@Injectable()
export class TemplatePermissionsMiddleware implements NestMiddleware {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly templatesService: TemplatesService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { user, params } = req;
    // creates a filter to get the report if the user is allowed to see it
    // looks like a monitor can see reports made by their team manager(s)
    // get the users teams

    if (!params.templateId) {
      throw new BadRequestException('Missing templateId');
    }

    const teams = await this.teamsService.findAllByUserId(user.id);

    const teamMemberIds: (MongooseObjectId | undefined)[] = [];
    for (const team of teams) {
      const members =
        (await this.teamMembersService.findAllTeamMembers(
          team.id,
          EMemberRole.Manager,
        )) ?? [];
      teamMemberIds.push(...members.map((m) => m.userId));
    }

    const filter: mongoose.FilterQuery<TemplateDocument> = {
      $and: [
        { _id: new MongooseObjectId(params.templateId) },
        {
          $or: [
            { public: true },
            { user: new MongooseObjectId(user.id) },
            ...teamMemberIds.map((id) => ({ user: id })),
          ],
        },
      ],
    };

    const template = await this.templatesService.findOne(filter);
    if (!template) {
      throw new ForbiddenException(
        "User doesn't have permissions to view this answer",
      );
    }
    req.template = template;
    req.userTeams = teams;
    next();
  }
}
