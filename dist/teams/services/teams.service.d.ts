import { Model } from 'mongoose';
import { TeamDocument } from '../models/team.schema';
import { TeamMemberDocument } from '../models/teamMember.schema';
import { TeamMembersService } from './teamMembers.service';
export declare class TeamsService {
    private teamModel;
    private readonly teamMembersService;
    constructor(teamModel: Model<TeamDocument>, teamMembersService: TeamMembersService);
    private readonly logger;
    create(name: TeamDocument["name"], loggedUser: any): Promise<TeamDocument>;
    findById(id: string): Promise<TeamDocument & {
        _id: any;
    }>;
    findAllByUserId(userId: string): Promise<TeamDocument[]>;
    findAllInvites(userEmail: string): Promise<TeamDocument[]>;
    findAllByTeamUserRelations(teamMembers: TeamMemberDocument[]): Promise<TeamDocument[]>;
    update(id: string, name: TeamDocument["name"]): Promise<TeamDocument>;
    delete(id: string): Promise<void>;
    findAllManagedTeams(userId: string): Promise<string[]>;
}
