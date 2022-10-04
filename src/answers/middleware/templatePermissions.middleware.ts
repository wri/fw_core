import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { EMemberRole } from "../../teams/models/teamMember.schema";
import { TemplatesService } from "../../templates/templates.service";
import { TeamMembersService } from "../../teams/services/teamMembers.service";
import { TeamsService } from "../../teams/services/teams.service";


type TRequest = {
  body: {
    loggedUser: any;
  };
  query: any;
} & Request;


@Injectable()
export class TemplatePermissionsMiddleware implements NestMiddleware {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly templatesService: TemplatesService
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const { user, params } = <TRequest>req;
    // creates a filter to get the report if the user is allowed to see it
    // looks like a monitor can see reports made by their team manager(s)
    // get the users teams
    const teams = await this.teamsService.findAllByUserId(user.id);

    // get managers of those teams
    const managers = [];
    for (const team of teams) {
      let teamUsers = await this.teamMembersService.findAllTeamMembers(team.id, EMemberRole.Manager);
      if (!teamUsers) teamUsers = [];
      let teamManagers = teamUsers.filter(
        teamUser => teamUser.role === EMemberRole.Manager || teamUser.role === EMemberRole.Administrator
      );
      teamManagers.forEach(manager => managers.push({ user: new mongoose.Types.ObjectId(manager.userId) }));
    }
    let filters = {};
    if (teams.length > 0) {
      filters = {
        $and: [
          { _id: new mongoose.Types.ObjectId(params.templateId) },
          {
            $or: [{ public: true }, { user: new mongoose.Types.ObjectId(user.id) }, ...managers]
          }
        ]
      };
    } else {
      filters = {
        $and: [
          { _id: new mongoose.Types.ObjectId(params.templateId) },
          {
            $or: [{ public: true }, { user: new mongoose.Types.ObjectId(user.id) }]
          }
        ]
      };
    }

    const template = await this.templatesService.findOne(filters);
    if (!template) {
      throw new HttpException("Template not found", HttpStatus.NOT_FOUND)
    }
    req.template = template;
    req.userTeams = teams;
    next();
  }
};