import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TemplatesService } from "../../templates/templates.service";
import { TeamMembersService } from "../../teams/services/teamMembers.service";
import { TeamsService } from "../../teams/services/teams.service";
export declare class TemplatePermissionsMiddleware implements NestMiddleware {
    private readonly teamsService;
    private readonly teamMembersService;
    private readonly templatesService;
    constructor(teamsService: TeamsService, teamMembersService: TeamMembersService, templatesService: TemplatesService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
