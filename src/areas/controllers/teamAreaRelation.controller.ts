import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  ParseArrayPipe,
} from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import { CreateTeamAreaRelationDto } from '../dto/createTeamAreaRelation.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TeamAreaRelationDocument } from '../models/teamAreaRelation.schema';
import { CreateTeamAreaRelationInput } from '../input/create-team-area-relation.input';

@Controller('arearelations/teams')
export class TeamAreaRelationController {
  constructor(
    private readonly areasService: AreasService,
    private readonly teamsService: TeamsService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
  ) {}

  private readonly logger = new Logger(TeamAreaRelationController.name);

  @Post()
  async createTeamAreaRelations(
    @Body(new ParseArrayPipe({ items: CreateTeamAreaRelationInput }))
    body: CreateTeamAreaRelationInput[],
  ): Promise<TeamAreaRelationDocument[]> {
    if (body.length === 0) return [];

    for (const relation of body) {
      const area = await this.areasService.getAreaMICROSERVICE(relation.areaId);
      if (!area)
        throw new NotFoundException(`Area ${relation.areaId} doesnt exist`);

      const team = await this.teamsService.findById(relation.teamId);
      if (!team)
        throw new NotFoundException(`Team ${relation.teamId} doesnt exist`);
    }

    const relations = body.map((relation) =>
      this.teamAreaRelationService.create(relation),
    );

    return Promise.all(relations);
  }

  @Post('/query')
  async query(
    @AuthUser() user: IUser,
    @Body() body: any,
  ): Promise<TeamAreaRelationDocument[]> {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can query team area relations');
    }

    return this.teamAreaRelationService.find(body);
  }

  @Delete()
  async deleteTeamAreaRelation(
    @Body() body: CreateTeamAreaRelationDto,
  ): Promise<void> {
    await this.teamAreaRelationService.delete(body);
  }

  // INTERNAL USE ONLY
  // GET /arearelations/teams/areaTeams/:areaId
  // Returns array of team ids linked to area
  @Get('/areaTeams/:areaId')
  async getAllTeamsForArea(@Param('areaId') areaId: string): Promise<string[]> {
    const area = await this.areasService.getAreaMICROSERVICE(areaId);
    if (!area)
      throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.teamAreaRelationService.find({
      areaId,
      teamId: { $exists: true, $ne: null },
    });
    return relations.map((relation) => relation.teamId);
  }

  // INTERNAL USE ONLY
  // GET /arearelations/teams/teamAreas/:teamId
  // Returns array of area ids linked to team
  @Get('/teamAreas/:teamId')
  async getAllAreasForTeam(@Param('teamId') teamId: string): Promise<string[]> {
    const team = await this.teamsService.findById(teamId);
    if (!team)
      throw new HttpException("Team doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.teamAreaRelationService.find({ teamId });
    return relations.map((relation) => relation.areaId);
  }

  @Delete('/deleteRelation/:teamId/:areaId')
  deleteOneRelation(
    @Param('teamId') teamId: string,
    @Param('areaId') areaId: string,
  ): void {
    this.teamAreaRelationService.delete({ teamId, areaId });
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForTeam/:teamId')
  deleteAllTeamRelations(@Param('teamId') teamId: string): void {
    this.teamAreaRelationService.delete({ teamId });
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForArea/:areaId')
  deleteAllAreaRelations(@Param('areaId') areaId: string): void {
    this.teamAreaRelationService.delete({ areaId });
  }
}
