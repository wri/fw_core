import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { CreateTeamAreaRelationDto } from '../dto/createTeamAreaRelation.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TeamAreaRelationDocument } from '../models/teamAreaRelation.schema';

@Controller('forest-watcher/arearelations/teams')
export class TeamAreaRelationController {
  constructor(
    private readonly areasService: AreasService,
    private readonly teamsService: TeamsService,
    private readonly teamAreaRelationService: TeamAreaRelationService
  ) { }

  private readonly logger = new Logger(TeamAreaRelationController.name);

  @Post()
  async createTeamAreaRelation(@Body() body: CreateTeamAreaRelationDto): Promise<TeamAreaRelationDocument> {
    const area = await this.areasService.getAreaMICROSERVICE(body.areaId);
    if(!area) throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const team = await this.teamsService.findById(body.teamId);
    if(!team) throw new HttpException("Team doesn't exist", HttpStatus.NOT_FOUND);
    return (await this.teamAreaRelationService.create(body))
  }

  @Delete()
  async deleteTeamAreaRelation(@Body() body: CreateTeamAreaRelationDto): Promise<void> {
    await this.teamAreaRelationService.delete(body);
  }

  // INTERNAL USE ONLY
  // GET /forest-watcher/arearelations/teams/areaTeams/:areaId
  // Returns array of team ids linked to area
  @Get('/areaTeams/:areaId')
  async getAllTeamsForArea(@Param('areaId') areaId: string): Promise<string[]> {
    const area = await this.areasService.getAreaMICROSERVICE(areaId);
    if(!area) throw new HttpException("Area doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.teamAreaRelationService.find({areaId});
    return relations.map(relation => relation.teamId)
  }

  // INTERNAL USE ONLY
  // GET /forest-watcher/arearelations/teams/teamAreas/:teamId
  // Returns array of area ids linked to team
  @Get('/teamAreas/:teamId')
  async getAllAreasForTeam(@Param('teamId') teamId: string): Promise<string[]> {
    const team = await this.teamsService.findById(teamId);
    if(!team) throw new HttpException("Team doesn't exist", HttpStatus.NOT_FOUND);
    const relations = await this.teamAreaRelationService.find({teamId});
    return relations.map(relation => relation.areaId)
  }

  @Delete('/deleteRelation/:teamId/:areaId')
  deleteOneRelation(@Param('teamId') teamId: string, @Param('areaId') areaId: string): void {
    this.teamAreaRelationService.delete({teamId, areaId})
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForTeam/:teamId')
  deleteAllTeamRelations(@Param('teamId') teamId: string): void {
    this.teamAreaRelationService.delete({teamId})
  }

  // INTERNAL USE ONLY
  @Delete('/deleteAllForArea/:areaId')
  deleteAllAreaRelations(@Param('areaId') areaId: string): void {
    this.teamAreaRelationService.delete({areaId})
  }


}
