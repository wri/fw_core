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
import { AnswersService } from '../answers/services/answers.service';
import { Answer, AnswerSchema } from '../answers/models/answer.model';
import { TemplateSchema } from '../templates/models/template.schema';
import { TemplatesService } from '../templates/templates.service';
import { S3Service } from '../answers/services/s3Service';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: 'reports', schema: TemplateSchema }],
      'formsDb',
    ),
    MongooseModule.forFeature(
      [{ name: Answer.name, schema: AnswerSchema }],
      'formsDb',
    ),
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
    AnswersService,
    TemplatesService,
    S3Service,
    StatisticsService,
  ],
})
export class StatisticsModule {}
