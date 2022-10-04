import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';
import { Team, TeamDocument } from '../models/team.schema';
import { EMemberRole, EMemberStatus, TeamMemberDocument } from '../models/teamMember.schema';
import { TeamMembersService } from './teamMembers.service';

@Injectable()
export class TeamsService {
    constructor(
        @InjectModel(Team.name, 'teamsDb') private teamModel: Model<TeamDocument>,
        private readonly teamMembersService: TeamMembersService,
    ) { }

    private readonly logger = new Logger(TeamsService.name)

    async create(name: TeamDocument["name"], loggedUser: any): Promise<TeamDocument> {
        const { id: userId, email: userEmail } = loggedUser; // ToDo: loggedUser Type

        const team = await new this.teamModel({ name }).save();
        const teamMember: CreateTeamMemberDto = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            teamId: team.id!,
            userId: userId,
            email: userEmail,
            role: EMemberRole.Administrator,
            status: EMemberStatus.Confirmed
        }
        // Create the Team User relation model
        // The logged-in user will become the "Administrator" of the team
        await this.teamMembersService.create(teamMember);

        return team;
    }

    async findById(id: string) {
        return await this.teamModel.findById(id);
    }

    async findAllByUserId(userId: string): Promise<TeamDocument[]> {
        const teamMembers: TeamMemberDocument[] = await this.teamMembersService.findAllByUserId(userId);
        return await this.findAllByTeamUserRelations(teamMembers);
    }

    async findAllInvites(userEmail: string): Promise<TeamDocument[]> {
        const teamMembers = await this.teamMembersService.findAllInvitesByUserEmail(userEmail);
        return await this.findAllByTeamUserRelations(teamMembers);
    }

    async findAllByTeamUserRelations(teamMembers: TeamMemberDocument[]): Promise<TeamDocument[]> {
        const teams: TeamDocument[] = [];
        for (let i = 0; i < teamMembers.length; i++) {
            const teamMember = teamMembers[i];
            const team = await this.findById(teamMember.teamId);
            team.userRole = teamMember.role;
            teams.push(team);
        }
        return teams;
    }

    async update(id: string, name: TeamDocument["name"]): Promise<TeamDocument> {
        return await this.teamModel.findByIdAndUpdate(id, { name }, { new: true });
    }

    async delete(id: string): Promise<void> {
        await this.teamModel.findByIdAndDelete(id);

        // Remove all team user relations
        await this.teamMembersService.removeAllUsersOnTeam(id);
    }

    async findAllManagedTeams(userId: string): Promise<string[]> {
        const teams = await this.teamMembersService.findAllByUserId(userId);
        const teamsManaged = teams.filter(team => team.role === EMemberRole.Manager || team.role === EMemberRole.Administrator)
        return teamsManaged.map(team => team.teamId);
    }
}
