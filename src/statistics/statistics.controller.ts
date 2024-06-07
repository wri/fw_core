import { Controller, Get, Logger, Param } from '@nestjs/common';
import { TeamDocument } from '../teams/models/team.schema';
import { TeamsService } from '../teams/services/teams.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import {
  EMemberRole,
  TeamMemberDocument,
} from '../teams/models/teamMember.schema';
import serializeTeam from '../teams/serializers/team.serializer';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';
import { AuthUser } from '../common/decorators';
import { IUser } from '../common/user.model';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import _ from 'lodash';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(StatisticsController.name);

  @Get('/teams')
  async teamStats(@AuthUser() user: IUser): Promise<any> {
    const teams: TeamDocument[] = await this.teamsService.findAll();
    const teamMembers = await this.teamMembersService.findAll();

    const groupedMembers = _.groupBy(teamMembers, (member) => member.teamId);
    const memberCounts: number[] = [];
    for (const [key, value] of Object.entries(groupedMembers))
      memberCounts.push(value.length);

    return {
      teamCount: teams.length,
      teamMembers: {
        mean: memberCounts.reduce((p, c) => p + c, 0) / memberCounts.length,
        median: this.median(memberCounts),
        max: Math.max(...memberCounts),
      },
    };
  }

  median(array: number[]): number {
    if (array.length === 0) return 0;
    array = [...array].sort((a, b) => a - b);
    const half = Math.floor(array.length / 2);
    return array.length % 2 ? array[half] : (array[half - 1] + array[half]) / 2;
  }
}
