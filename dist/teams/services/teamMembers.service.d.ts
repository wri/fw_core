import { Model } from 'mongoose';
import { UserService } from '../../common/user.service';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';
import { EMemberRole, TeamMemberDocument } from '../models/teamMember.schema';
export declare class TeamMembersService {
    private teamMemberModel;
    private readonly userService;
    static findById(memberId: any): TeamMemberDocument | PromiseLike<TeamMemberDocument>;
    constructor(teamMemberModel: Model<TeamMemberDocument>, userService: UserService);
    private readonly logger;
    create(createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMemberDocument>;
    createMany(teamMembersToAdd: CreateTeamMemberDto[]): Promise<(TeamMemberDocument & {
        _id: any;
    })[]>;
    findTeamMember(teamId: string, userId: string): Promise<TeamMemberDocument>;
    findById(id: string): Promise<TeamMemberDocument>;
    findAllTeamMembers(teamId: string, teamUserRole: EMemberRole): Promise<TeamMemberDocument[]>;
    findAllByUserId(userId: string): Promise<TeamMemberDocument[]>;
    findAllInvitesByUserEmail(userEmail: string): Promise<TeamMemberDocument[]>;
    update(teamId: string, userEmail: string, update: Partial<TeamMemberDocument>): Promise<TeamMemberDocument>;
    remove(teamUserId: string): Promise<TeamMemberDocument>;
    findFullNameForTeamMember(teamMember: TeamMemberDocument): Promise<TeamMemberDocument>;
    findFullNameForTeamMembers(teamMembers: TeamMemberDocument[]): Promise<TeamMemberDocument[]>;
    removeAllUsersOnTeam(teamId: string): Promise<import("mongodb").DeleteResult>;
}
