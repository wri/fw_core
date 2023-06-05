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

  @Delete()
  async deleteTeamAreaRelation(
    @Body(new ParseArrayPipe({ items: CreateTeamAreaRelationDto }))
    body: CreateTeamAreaRelationDto[],
  ): Promise<void> {
    await this.teamAreaRelationService.delete({
      $or: body.map((relation) => ({
        areaId: relation.areaId,
        teamId: relation.teamId,
      })),
    });
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
  async deleteOneRelation(
    @Param('teamId') teamId: string,
    @Param('areaId') areaId: string,
  ): Promise<void> {
    await this.teamAreaRelationService.delete({ teamId, areaId });
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForTeam/:teamId')
  async deleteAllTeamRelations(@Param('teamId') teamId: string): Promise<void> {
    await this.teamAreaRelationService.delete({ teamId });
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForArea/:areaId')
  async deleteAllAreaRelations(@Param('areaId') areaId: string): Promise<void> {
    await this.teamAreaRelationService.delete({ areaId });
  }
}
