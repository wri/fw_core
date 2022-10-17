import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../../common/user.service';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';
import { EMemberRole, EMemberStatus, ITeamMember, TeamMember, TeamMemberDocument } from '../models/teamMember.schema';
import mongoose from 'mongoose';

@Injectable()
export class TeamMembersService {
  static findById(memberId: any): TeamMemberDocument | PromiseLike<TeamMemberDocument> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectModel('teamuserrelations', 'teamsDb') private teamMemberModel: Model<TeamMemberDocument>,
    private readonly userService: UserService
    ) { }

  private readonly logger = new Logger(TeamMembersService.name)

  async create(createTeamMemberDto: CreateTeamMemberDto): Promise<TeamMemberDocument> {
    const createdTeamMember: TeamMemberDocument = new this.teamMemberModel(createTeamMemberDto);
    return createdTeamMember.save();
  }

  createMany(teamMembersToAdd: CreateTeamMemberDto[]) {
    return this.teamMemberModel.insertMany(teamMembersToAdd);
  }

  async findTeamMember(teamId: string, userId: string): Promise<TeamMemberDocument> {
    return this.findFullNameForTeamMember(
      await this.teamMemberModel.findOne({
        teamId,
        userId
      })
    );
  }

  async findById(id: string): Promise<TeamMemberDocument> {
    return this.findFullNameForTeamMember(await this.teamMemberModel.findById(id));
  }

  async findAllTeamMembers(teamId: string, teamUserRole: EMemberRole): Promise<TeamMemberDocument[]> {
    if (teamUserRole === EMemberRole.Administrator || teamUserRole === EMemberRole.Manager) {
      return this.findFullNameForTeamMembers(await this.teamMemberModel.find({ teamId }));
    } else {
      return this.findFullNameForTeamMembers(await this.teamMemberModel.find({ teamId }).select("-status"));
    }
  }

  async findAllByUserId(userId: string): Promise<TeamMemberDocument[]> {
    if(!userId) return [];
    else return this.findFullNameForTeamMembers(
      await this.teamMemberModel.find({
        userId: new mongoose.Types.ObjectId(userId)
      })
    );
  }

  async findAllInvitesByUserEmail(userEmail: string) {
    return this.findFullNameForTeamMembers(
      await this.teamMemberModel.find({
        email: userEmail,
        status: EMemberStatus.Invited
      })
    );
  }

  async update(teamId: string, userEmail: string, update: Partial<TeamMemberDocument>): Promise<TeamMemberDocument> {
    return this.teamMemberModel.findOneAndUpdate({ teamId, email: userEmail }, update, { new: true });
  }

  async remove(teamUserId: string): Promise<TeamMemberDocument> {
    return await this.teamMemberModel.findByIdAndDelete(teamUserId);
  }

  async findFullNameForTeamMember(teamMember: TeamMemberDocument): Promise<TeamMemberDocument> {
    if (teamMember && teamMember.userId) {
      const name = await this.userService.getNameByIdMICROSERVICE(teamMember.userId.toString());
      teamMember.name = name
    }
    return teamMember;
  }

  async findFullNameForTeamMembers(teamMembers: TeamMemberDocument[]): Promise<TeamMemberDocument[]> {
    return Promise.all(teamMembers.map(async teamMember => this.findFullNameForTeamMember(teamMember)));
  }

  async removeAllUsersOnTeam(teamId: string) {
    return await this.teamMemberModel.deleteMany({
      teamId: new mongoose.Types.ObjectId(teamId)
    });
  }

  async findAllUsersManaged(userId: string): Promise<string[]> {
    const teams = await this.teamMemberModel.find({userId});
    const users: string[] = [];
    for await (const team of teams) {
      if(team.role === EMemberRole.Administrator || team.role === EMemberRole.Manager) {
        const teamUsers = await this.teamMemberModel.find({teamId: team.teamId})
        users.push(...teamUsers.map(user => user.userId ? user.userId.toString() : null))
      }
    }
    return users;
  }

}
