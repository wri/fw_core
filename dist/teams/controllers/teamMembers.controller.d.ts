import { Model } from 'mongoose';
import { TeamsService } from '../services/teams.service';
import { Request } from "express";
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamMemberDocument } from '../models/teamMember.schema';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';
export declare class TeamMembersController {
    private readonly teamsService;
    private readonly teamMembersService;
    private teamMemberModel;
    constructor(teamsService: TeamsService, teamMembersService: TeamMembersService, teamMemberModel: Model<TeamMemberDocument>);
    private readonly logger;
    findAllTeamMembers(request: Request, params: any): Promise<any>;
    addTeamMembers(members: CreateTeamMemberDto[], params: any): Promise<any>;
    reassignAdmin(request: Request, params: any): Promise<any>;
    updateMemberRole(request: Request, params: any): Promise<any>;
    deleteMember(request: Request, params: any): Promise<void>;
    acceptInvitation(request: Request, params: any): Promise<any>;
    declineInvitation(request: Request, params: any): Promise<any>;
    leaveTeam(request: Request, params: any): Promise<any>;
}
