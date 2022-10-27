import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamsService } from '../services/teams.service';
import { Request } from 'express';
import { TeamMembersService } from '../services/teamMembers.service';
import {
  EMemberRole,
  EMemberStatus,
  TeamMember,
  TeamMemberDocument,
} from '../models/teamMember.schema';
import serializeTeamMember from '../serializers/teamMember.serializer';
import { CreateTeamMemberDto } from '../dto/createTeamMember.dto';

@Controller('teams/:teamId/users')
export class TeamMembersController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    @InjectModel('teamuserrelations', 'teamsDb')
    private teamMemberModel: Model<TeamMemberDocument>,
  ) {}
  private readonly logger = new Logger(TeamMembersController.name);

  // GET /v3/teams/:teamId/users
  // Return all users on a team
  @Get()
  async findAllTeamMembers(
    @Req() request: Request,
    @Param() params,
  ): Promise<any> {
    let loggedUser;
    if (request.query && request.query.loggedUser)
      loggedUser = (request.query as any).loggedUser;
    else throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    const { id: userId } = JSON.parse(loggedUser);
    const { teamId } = params;
    const teamMember = await this.teamMembersService.findTeamMember(
      teamId,
      userId,
    );

    if (!teamMember) throw new NotFoundException();

    const members = await this.teamMembersService.findAllTeamMembers(
      teamId,
      teamMember.role,
    );

    return { data: serializeTeamMember(members) };
  }

  // POST /v3/teams/:teamId/users
  // Add users to team, and send invitations
  // Only manager or admin can access this router
  @Post()
  async addTeamMembers(
    @Body() members: CreateTeamMemberDto[],
    @Param() params,
  ): Promise<any> {
    const { teamId } = params;

    const userEmails: string[] = [];
    for (let i = 0; i < members.length; i++) {
      const userEmail = members[i].email;

      if (!userEmails.includes(userEmail)) {
        userEmails.push(userEmail);
      } else
        throw new HttpException(
          "Can't have duplicate users on team",
          HttpStatus.BAD_REQUEST,
        );
    }

    // Make sure no duplicate users are added
    const duplicateUsers = await this.teamMemberModel.count({
      teamId,
      email: { $in: userEmails },
    });
    if (duplicateUsers > 0)
      throw new HttpException(
        "Can't have duplicate users on team",
        HttpStatus.BAD_REQUEST,
      );

    const membersToAdd = members.map((member) => {
      return {
        teamId,
        email: member.email,
        role: member.role,
        status: EMemberStatus.Invited,
      };
    });

    const memberDocuments = await this.teamMembersService.createMany(
      membersToAdd,
    );

    // ToDo: Send Invitations "userEmails"

    return { data: serializeTeamMember(memberDocuments) };
  }

  // PATCH /v3/teams/:teamId/users/reassignAdmin/:userId
  // Reassign the admin role to a different user
  // Only admin can access this router
  @Patch('/reassignAdmin/:userId')
  async reassignAdmin(@Req() request: Request, @Param() params): Promise<any> {
    const { userId, teamId } = params;
    const { body } = request;
    const { id: loggedUserId } = body.loggedUser;

    const teamUser = await this.teamMembersService.findTeamMember(
      teamId,
      userId,
    );
    const adminUser = await this.teamMembersService.findTeamMember(
      teamId,
      loggedUserId,
    );

    if (!teamUser)
      throw new HttpException(
        'A user with this id is not a member of this team',
        HttpStatus.NOT_FOUND,
      );
    if (!adminUser)
      throw new HttpException(
        'A user with this id is not the admin of this team',
        HttpStatus.NOT_FOUND,
      );

    teamUser.role = EMemberRole.Administrator;
    adminUser.role = EMemberRole.Manager;

    await teamUser.save();
    await adminUser.save();

    return { data: serializeTeamMember(teamUser) };
  }

  // PATCH /v3/teams/:teamId/users/:teamUserId
  // Update a user's role on a team
  // body: { role }
  // Only manager or admin can access this router
  @Patch('/:memberId')
  async updateMemberRole(
    @Req() request: Request,
    @Param() params,
  ): Promise<any> {
    const { memberId } = params;
    const { body } = request;

    if (body.role === EMemberRole.Administrator)
      throw new HttpException(
        'Please use /teams/:teamId/reassignAdmin/:userId to reassign admin',
        HttpStatus.BAD_REQUEST,
      );

    const member = await this.teamMembersService.findById(memberId);

    if (!member)
      throw new HttpException("Member doesn't exist", HttpStatus.NOT_FOUND);

    if (member.role === EMemberRole.Administrator)
      throw new HttpException(
        "Can't change the administrator's role",
        HttpStatus.BAD_REQUEST,
      );
    if (
      member.status === EMemberStatus.Invited ||
      member.status === EMemberStatus.Declined
    )
      throw new HttpException(
        "Can't update a user's role before they have accepted an invitation",
        HttpStatus.BAD_REQUEST,
      );

    member.role = body.role;
    await member.save();

    return { data: serializeTeamMember(member) };
  }

  // DELETE /v3/teams/:teamId/users/:teamUserId
  // Remove a member from a team
  // Only Admin and Managers and the member themselves can remove members
  // Can't remove the Admin
  @Delete('/:memberId')
  async deleteMember(@Req() request: Request, @Param() params): Promise<void> {
    const { memberId, teamId } = params;
    let loggedUser;
    if (request.query && request.query.loggedUser)
      loggedUser = (request.query as any).loggedUser;
    else throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    const { id: loggedUserId } = JSON.parse(loggedUser);

    const teamMemberToDelete = await this.teamMembersService.findById(memberId);
    const currentUser = await this.teamMembersService.findTeamMember(
      teamId,
      loggedUserId,
    );

    if (!teamMemberToDelete)
      throw new HttpException(
        "This team member doesn't exist",
        HttpStatus.NOT_FOUND,
      );

    if (!currentUser)
      throw new UnauthorizedException(
        "Current user doesn't belong to member team",
      );

    const authorised =
      teamMemberToDelete &&
      (currentUser.role === EMemberRole.Administrator ||
        currentUser.role === EMemberRole.Manager ||
        teamMemberToDelete.userId?.toString() === loggedUserId);
    if (!authorised)
      throw new HttpException(
        'You are not authorized to remove this user from this team',
        HttpStatus.FORBIDDEN,
      );

    if (teamMemberToDelete.role === EMemberRole.Administrator)
      throw new HttpException(
        "Can't remove the administrator",
        HttpStatus.BAD_REQUEST,
      );

    await this.teamMembersService.remove(memberId);

    return;
  }

  // PATCH /v3/teams/:teamId/users/:userId/accept
  // Update user's role to "confirmed"
  // Only if JWT's userid match the one in the URL
  @Patch('/:userId/accept')
  async acceptInvitation(
    @Req() request: Request,
    @Param() params,
  ): Promise<any> {
    const { userId, teamId } = params;
    const { body } = request;
    const { id: loggedUserId, email: loggedEmail } = body.loggedUser;

    if (userId !== loggedUserId)
      throw new HttpException(
        'Login with the correct user',
        HttpStatus.FORBIDDEN,
      );

    const updatedMember = await this.teamMembersService.update(
      teamId,
      loggedEmail,
      {
        userId: loggedUserId,
        status: EMemberStatus.Confirmed,
      },
    );

    return { data: serializeTeamMember(updatedMember) };
  }

  // PATCH /v3/teams/:teamId/users/:userId/decline
  // Update user's role to "confirmed"
  // Only if JWT's userid match the one in the URL
  @Patch('/:userId/decline')
  async declineInvitation(
    @Req() request: Request,
    @Param() params,
  ): Promise<any> {
    const { userId, teamId } = params;
    const { body } = request;
    const { id: loggedUserId, email: loggedEmail } = body.loggedUser;

    if (userId !== loggedUserId)
      throw new HttpException(
        'Login with the correct user',
        HttpStatus.FORBIDDEN,
      );

    const updatedMember = await this.teamMembersService.update(
      teamId,
      loggedEmail,
      {
        userId: loggedUserId,
        status: EMemberStatus.Declined,
      },
    );

    return { data: serializeTeamMember(updatedMember) };
  }

  // PATCH /v3/teams/:teamId/users/:userId/leave
  // Update user's role to "left"
  // Only if JWT's userid match the one in the URL
  // Unless auth user is admin
  @Patch('/:userId/leave')
  async leaveTeam(@Req() request: Request, @Param() params): Promise<any> {
    const { teamId, userId } = params;
    const { body } = request;
    const { id: loggedUserId, email: loggedEmail } = body.loggedUser;

    if (userId !== loggedUserId)
      throw new HttpException(
        'Login with the correct user',
        HttpStatus.FORBIDDEN,
      );

    const teamMember = await this.teamMembersService.findTeamMember(
      teamId,
      userId,
    );

    if (teamMember && teamMember.role === EMemberRole.Administrator)
      throw new HttpException(
        "Administrator can't leave team",
        HttpStatus.BAD_REQUEST,
      );

    const updatedMember = await this.teamMembersService.update(
      teamId,
      loggedEmail,
      {
        role: EMemberRole.Left,
      },
    );

    return { data: serializeTeamMember(updatedMember) };
  }
}
