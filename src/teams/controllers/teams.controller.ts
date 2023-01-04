import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { TeamDocument } from '../models/team.schema';
import { TeamsService } from '../services/teams.service';
import { Request } from 'express';
import { TeamMembersService } from '../services/teamMembers.service';
import { EMemberRole, EMemberStatus, TeamMemberDocument } from '../models/teamMember.schema';
import serializeTeam from '../serializers/team.serializer';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { AuthUser } from '../../common/decorators';
import { IUser } from '../../common/user.model';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
  ) {}
  private readonly logger = new Logger(TeamsController.name);

  @Get('/myinvites')
  async findMyInvites(@AuthUser() user: IUser, @Param() _params): Promise<any> {
    const { email: loggedEmail } = user;

    const teams: TeamDocument[] = await this.teamsService.findAllInvites(
      loggedEmail,
    );

    // get members of teams and areas of team
    const teamsToSend: TeamDocument[] = [];
    for await (const team of teams) {
      const teamId = team._id;
      const members: TeamMemberDocument[] =
        await this.teamMembersService.findAllTeamMembers(
          teamId,
          EMemberRole.Monitor,
        );

      team.members = members;

      // array of area ids
      const areas = await this.teamAreaRelationService.find({ teamId });
      if (areas) team.areas = areas.map((area) => area.areaId);
      else team.areas = [];

      teamsToSend.push(team);
    }

    return { data: serializeTeam(teamsToSend) };
  }

  // GET /v3/teams/user/:userId
  // Get Teams by user id
  // Return the user's teams that have admin, manager or monitor roles
  // ToDo: What security is need?
  @Get('/user/:id')
  async getUserTeams(@AuthUser() user: IUser, @Param() params): Promise<any> {
    const { id } = params;
    const { id: userId } = user;

    this.logger.log(`Getting all teams for user ${userId}`);

    const teams = await this.teamsService.findAllByUserId(id);
    const filteredTeams = teams.filter(
      (team) =>
        team.userRole !== EMemberRole.Left &&
        team.status === EMemberStatus.Confirmed,
    );

    // get members of teams and areas of team
    const teamsToSend: TeamDocument[] = [];
    for await (const team of filteredTeams) {
      const teamId = team._id;
      const teamUserRelation = await this.teamMembersService.findTeamMember(
        teamId,
        userId,
      );

      if (teamUserRelation) {
        const members: TeamMemberDocument[] =
          await this.teamMembersService.findAllTeamMembers(
            teamId,
            teamUserRelation.role,
          );

        team.members = members;
      }

      // array of area ids
      const areas = await this.teamAreaRelationService.find({ teamId });
      if (areas) team.areas = areas.map((area) => area.areaId);
      else team.areas = [];

      teamsToSend.push(team);
    }

    return { data: serializeTeam(teamsToSend) };
  }

  // GET /v3/teams/:teamId
  @Get('/:teamId')
  async getTeam(@Param() params): Promise<any> {
    const { teamId } = params;

    const team = await this.teamsService.findById(teamId);
    if (!team) throw new HttpException('Team not found', HttpStatus.NOT_FOUND);
    return { data: serializeTeam(team) };
  }

  @Post()
  async create(@Req() request: Request, @AuthUser() user: IUser): Promise<any> {
    const { body } = request;
    if (!body.name)
      throw new HttpException('Team must have a name', HttpStatus.BAD_REQUEST);
    const team: TeamDocument = await this.teamsService.create(body.name, user);
    return { data: serializeTeam(team) };
  }

  // PATCH /v3/teams/:teamId
  // Need to be admin or manager
  @Patch('/:teamId')
  async updateTeam(@Req() request: Request, @Param() params): Promise<any> {
    const { teamId } = params;
    const { body } = request;

    const team = await this.teamsService.findById(teamId);
    if (!team)
      throw new HttpException("Team doesn't exist", HttpStatus.NOT_FOUND);

    const updatedTeam = await this.teamsService.update(
      teamId,
      body.name,
      body.layers,
    );

    return { data: serializeTeam(updatedTeam) };
  }

  // DELETE /v3/teams/:teamId
  // Need to be admin
  @Delete('/:teamId')
  async deleteTeam(@Param() params): Promise<void> {
    const { teamId } = params;

    const team = await this.teamsService.findById(teamId);
    if (!team)
      throw new HttpException("Team doesn't exist", HttpStatus.NOT_FOUND);

    await this.teamsService.delete(teamId);
  }
}
