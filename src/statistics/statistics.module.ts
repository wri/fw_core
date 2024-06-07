import { Module } from '@nestjs/common';
import { TeamsService } from '../teams/services/teams.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamSchema } from '../teams/models/team.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { TeamMemberSchema } from '../teams/models/teamMember.schema';
import { StatisticsController } from './statistics.controller';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';
import { UserService } from '../common/user.service';
import { TeamAreaRelationSchema } from '../areas/models/teamAreaRelation.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: 'gfwteams', schema: TeamSchema }],
      'teamsDb',
    ),
    MongooseModule.forFeature(
      [{ name: 'teamuserrelations', schema: TeamMemberSchema }],
      'teamsDb',
    ),
    MongooseModule.forFeature(
      [{ name: 'areateamrelations', schema: TeamAreaRelationSchema }],
      'apiDb',
    ),
  ],
  controllers: [StatisticsController],
  providers: [
    TeamsService,
    TeamMembersService,
    TeamAreaRelationService,
    UserService,
  ],
})
export class StatisticsModule {}
