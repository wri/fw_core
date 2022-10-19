import { TeamsService } from '../services/teams.service';
import { Request } from "express";
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
export declare class TeamsController {
    private readonly teamsService;
    private readonly teamMembersService;
    private readonly teamAreaRelationService;
    constructor(teamsService: TeamsService, teamMembersService: TeamMembersService, teamAreaRelationService: TeamAreaRelationService);
    private readonly logger;
    findMyInvites(request: Request, params: any): Promise<any>;
    getTeam(params: any): Promise<any>;
    getUserTeams(request: Request, params: any): Promise<any>;
    create(request: Request): Promise<any>;
    updateTeam(request: Request, params: any): Promise<any>;
    deleteTeam(params: any): Promise<void>;
}
