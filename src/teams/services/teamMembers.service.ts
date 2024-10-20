import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../../common/user.service';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';
import {
  EMemberRole,
  EMemberStatus,
  TeamMemberDocument,
} from '../models/teamMember.schema';
import mongoose from 'mongoose';

@Injectable()
export class TeamMembersService {
  static findById(
    _memberId: any,
  ): TeamMemberDocument | PromiseLike<TeamMemberDocument> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel('teamuserrelations', 'teamsDb')
    private teamMemberModel: Model<TeamMemberDocument>,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(TeamMembersService.name);

  async create(
    createTeamMemberDto: CreateTeamMemberDto,
  ): Promise<TeamMemberDocument> {
    const createdTeamMember: TeamMemberDocument = new this.teamMemberModel(
      createTeamMemberDto,
    );
    return createdTeamMember.save();
  }

  createMany(teamMembersToAdd: CreateTeamMemberDto[]) {
    return this.teamMemberModel.insertMany(teamMembersToAdd);
  }

  async findTeamMember(
    teamId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
  ): Promise<TeamMemberDocument | null> {
    const member = await this.teamMemberModel.findOne({
      teamId,
      userId,
    });

    if (!member) return null;

    return this.findFullNameForTeamMember(member);
  }

  async findById(id: string): Promise<TeamMemberDocument | null> {
    const member = await this.teamMemberModel.findById(id);
    if (!member) return null;
    return this.findFullNameForTeamMember(member);
  }

  async findAllTeamMembers(
    teamId: string,
    teamUserRole: EMemberRole,
  ): Promise<TeamMemberDocument[]> {
    if (
      teamUserRole === EMemberRole.Administrator ||
      teamUserRole === EMemberRole.Manager
    ) {
      return this.findFullNameForTeamMembers(
        await this.teamMemberModel.find({ teamId }),
      );
    } else {
      return this.findFullNameForTeamMembers(
        await this.teamMemberModel.find({ teamId }).select('-status'),
      );
    }
  }

  async findAllByUserId(userId: string): Promise<TeamMemberDocument[]> {
    if (!userId) return [];
    else
      return this.findFullNameForTeamMembers(
        await this.teamMemberModel.find({
          userId: new mongoose.Types.ObjectId(userId),
        }),
      );
  }

  async findAllInvitesByUserEmail(userEmail: string) {
    return this.findFullNameForTeamMembers(
      await this.teamMemberModel.find({
        email: userEmail,
        status: EMemberStatus.Invited,
      }),
    );
  }

  async update(
    teamId: string,
    userEmail: string,
    update: Partial<TeamMemberDocument>,
  ): Promise<TeamMemberDocument | null> {
    return this.teamMemberModel.findOneAndUpdate(
      { teamId, email: userEmail },
      update,
      { new: true },
    );
  }

  async remove(teamUserId: string): Promise<TeamMemberDocument | null> {
    return await this.teamMemberModel.findByIdAndDelete(teamUserId);
  }

  async findFullNameForTeamMember(
    teamMember: TeamMemberDocument,
  ): Promise<TeamMemberDocument> {
    if (teamMember && teamMember.userId) {
      const name = await this.userService.getNameByIdMICROSERVICE(
        teamMember.userId.toString(),
      );
      teamMember.name = name;
    }
    return teamMember;
  }

  async findFullNameForTeamMembers(
    teamMembers: TeamMemberDocument[],
  ): Promise<TeamMemberDocument[]> {
    return Promise.all(
      teamMembers.map(async (teamMember) =>
        this.findFullNameForTeamMember(teamMember),
      ),
    );
  }

  async removeAllUsersOnTeam(teamId: string): Promise<{
    acknowledged: boolean;
    deletedCount: number;
  }> {
    return await this.teamMemberModel.deleteMany({
      teamId: new mongoose.Types.ObjectId(teamId),
    });
  }

  async findAllUsersManaged(userId: string): Promise<(string | null)[]> {
    const teams = await this.teamMemberModel.find({ userId });
    const users: (string | null)[] = [];
    for await (const team of teams) {
      if (
        team.role === EMemberRole.Administrator ||
        team.role === EMemberRole.Manager
      ) {
        const teamUsers = await this.teamMemberModel.find({
          teamId: team.teamId,
        });
        users.push(
          ...teamUsers.map((user) =>
            user.userId ? user.userId.toString() : null,
          ),
        );
      }
    }
    return users;
  }

  async findEveryTeamMember(userId: string): Promise<(string | null)[]> {
    const teams = await this.teamMemberModel.find({ userId });
    const users: (string | null)[] = [];
    for await (const team of teams) {
      if (team.role === EMemberRole.Left) continue;
      if (
        team.status === EMemberStatus.Declined ||
        team.status === EMemberStatus.Invited
      )
        continue;
      const teamUsers = await this.teamMemberModel.find({
        teamId: team.teamId,
      });
      users.push(
        ...teamUsers.map((user) =>
          user.userId ? user.userId.toString() : null,
        ),
      );
    }

    return users;
  }

  async deleteAllForUser(userId: string): Promise<any> {
    const teamsDeletedFrom: string[] = [];
    const teamsNotDeletedFrom: string[] = [];
    const errors: { id: any; error: string | unknown }[] = [];
    const teamMemberRelations = await this.teamMemberModel.find({ userId });
    for await (const relation of teamMemberRelations) {
      if (relation.role === EMemberRole.Administrator) {
        teamsNotDeletedFrom.push(relation.teamId.toString());
        errors.push({ id: relation.id, error: 'admin' });
      } else {
        try {
          const deletedRelation = await this.teamMemberModel.findByIdAndDelete(
            relation._id,
          );
          if (deletedRelation)
            teamsDeletedFrom.push(relation.teamId.toString());
        } catch (error) {
          teamsNotDeletedFrom.push(relation.teamId.toString());
          errors.push({ id: relation.teamId.toString(), error });
        }
      }
    }

    return {
      teamsDeletedFrom,
      teamsNotDeletedFrom,
      errors,
    };
  }

  async findAll(): Promise<TeamMemberDocument[]> {
    return this.teamMemberModel.find({});
  }

  async getTeamMemberCounts(): Promise<number[]> {
    return this.teamMemberModel.aggregate([
      { $group: { _id: '$teamId', count: { $sum: 1 } } },
    ]);
  }
}
