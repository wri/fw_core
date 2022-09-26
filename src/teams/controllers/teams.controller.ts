import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Patch, Post, Req } from '@nestjs/common';
import { CreateTeamDto } from '../dto/createTeam.dto';
import { Team, TeamDocument } from '../models/team.schema';
import { TeamsService } from '../services/teams.service';
import { Request } from "express";
import { TeamMembersService } from '../services/teamMembers.service';
import { EMemberRole, TeamMemberDocument } from '../models/teamMember.schema';
import serializeTeam from '../serializers/team.serializer';

@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService
  ) { }
  private readonly logger = new Logger(TeamsController.name)

  @Get('/myinvites')
  async findMyInvites(@Req() request: Request, @Param() params): Promise<any> {
    let loggedUser;
    if (request.query && request.query.loggedUser) loggedUser = (request.query as any).loggedUser;
    else throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    const { email: loggedEmail } = JSON.parse(loggedUser);

    const teams: TeamDocument[] = await this.teamsService.findAllInvites(loggedEmail);

    // get members of teams and areas of team
    const teamsToSend = [];
    for await (const team of teams) {
      const teamId = team._id;
      const members: TeamMemberDocument[] = await this.teamMembersService.findAllTeamMembers(teamId, EMemberRole.Monitor);

      team.members = members;

      // TODO array of area ids
      /*     const areas = await AreaService.getTeamAreas(teamId);
          team.areas = [];
          if (areas) team.areas = areas; */

      teamsToSend.push(team);
    }

    return {data: serializeTeam(teamsToSend)};
  }

  // GET /v3/teams/:teamId
  @Get('/:teamId')
  async getTeam(@Param() params): Promise<any> {
    const { teamId } = params;

    const team = await this.teamsService.findById(teamId);

    return {data: serializeTeam(team)};
  };

  // GET /v3/teams/user/:userId
  // Get Teams by user id
  // Return the user's teams that have admin, manager or monitor roles
  // ToDo: What security is need?
  @Get('/user/:id')
  async getUserTeams(@Req() request: Request, @Param() params): Promise<any> {
    const { id } = params;
    let loggedUser;
    if (request.query && request.query.loggedUser) loggedUser = (request.query as any).loggedUser;
    else throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    const { id: userId } = JSON.parse(loggedUser);

    const teams = await this.teamsService.findAllByUserId(id);
    const filteredTeams = teams.filter(team => team.userRole !== EMemberRole.Left);

    // get members of teams and areas of team
    const teamsToSend = [];
    for await (const team of filteredTeams) {

      const teamId = team._id;
      const teamUserRelation = await this.teamMembersService.findTeamMember(teamId, userId);

      const members: TeamMemberDocument[] = await this.teamMembersService.findAllTeamMembers(
        teamId,
        teamUserRelation.role
      );

      team.members = members;

      //TODO array of area ids
      /*     const areas = await AreaService.getTeamAreas(teamId);
          team.areas = [];
          if (areas) team.areas = areas; */

      teamsToSend.push(team);
    }

    return {data: serializeTeam(teamsToSend)};
  };

  @Post()
  async create(@Req() request: Request): Promise<any> {

    const { body } = request
    const team: TeamDocument = await this.teamsService.create(body.name, body.loggedUser);
    return { data: serializeTeam(team) };
  }

  // PATCH /v3/teams/:teamId
  // Need to be admin or manager
  @Patch('/:teamId')
  async updateTeam(@Req() request: Request, @Param() params): Promise<any> {
    const { teamId } = params;
    const { body } = request;

    const team = await this.teamsService.update(teamId, body.name);

    return {data: serializeTeam(team)};
  };

  // DELETE /v3/teams/:teamId
  // Need to be admin
  @Delete('/:teamId')
  async deleteTeam(@Param() params): Promise<void> {
    const { teamId } = params;

    await this.teamsService.delete(teamId);

    return null
  };

}
