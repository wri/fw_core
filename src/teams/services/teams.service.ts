import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';
import { TeamDocument } from '../models/team.schema';
import {
  EMemberRole,
  EMemberStatus,
  TeamMemberDocument,
} from '../models/teamMember.schema';
import { TeamMembersService } from './teamMembers.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel('gfwteams', 'teamsDb') private teamModel: Model<TeamDocument>,
    private teamAreaRelationService: TeamAreaRelationService,
    private readonly teamMembersService: TeamMembersService,
  ) {}

  private readonly logger = new Logger(TeamsService.name);

  async create(
    name: TeamDocument['name'],
    loggedUser: any,
  ): Promise<TeamDocument> {
    const { id: userId, email: userEmail } = loggedUser; // ToDo: loggedUser Type

    const layers: string[] = [];

    const team = await new this.teamModel({ name, layers }).save();
    const teamMember: CreateTeamMemberDto = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      teamId: team.id,
      userId: userId,
      email: userEmail,
      role: EMemberRole.Administrator,
      status: EMemberStatus.Confirmed,
    };
    // Create the Team User relation model
    // The logged-in user will become the "Administrator" of the team
    await this.teamMembersService.create(teamMember);

    return team;
  }

  async findById(id: string): Promise<TeamDocument | null> {
    return await this.teamModel.findById(id);
  }

  async findAllByUserId(userId: string): Promise<TeamDocument[]> {
    const teamMembers: TeamMemberDocument[] =
      await this.teamMembersService.findAllByUserId(userId);
    return await this.findAllByTeamUserRelations(teamMembers);
  }

  async findAllInvites(userEmail: string): Promise<TeamDocument[]> {
    const teamMembers = await this.teamMembersService.findAllInvitesByUserEmail(
      userEmail,
    );
    return await this.findAllByTeamUserRelations(teamMembers);
  }

  async findAllByTeamUserRelations(
    teamMembers: TeamMemberDocument[],
  ): Promise<TeamDocument[]> {
    const teams: TeamDocument[] = [];

    for (const member of teamMembers) {
      const team = await this.findById(member.teamId.toString());
      if (team) {
        team.userRole = member.role;
        team.status = member.status;
        teams.push(team);
      }
    }

    return teams;
  }

  async update(
    id: string,
    name: TeamDocument['name'],
    layers: TeamDocument['layers'],
  ): Promise<TeamDocument | null> {
    return await this.teamModel.findByIdAndUpdate(
      id,
      { name, layers },
      { new: true },
    );
  }

  async delete(id: string): Promise<void> {
    await this.teamModel.findByIdAndDelete(id);

    // Remove all team area relations
    await this.teamAreaRelationService.delete({ teamId: id });

    // Remove all team user relations
    await this.teamMembersService.removeAllUsersOnTeam(id);
  }

  async findAllManagedTeams(userId: string): Promise<string[]> {
    const teams = await this.teamMembersService.findAllByUserId(userId);
    const teamsManaged = teams.filter(
      (team) =>
        team.role === EMemberRole.Manager ||
        team.role === EMemberRole.Administrator,
    );
    return teamsManaged.map((team) => team.teamId.toString());
  }

  async findAll(): Promise<TeamDocument[]> {
    return await this.teamModel.find({});
  }
}
