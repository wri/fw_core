import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AnswersService } from './services/answers.service';
import { AnswersController } from './answers.controller';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { UserService } from '../common/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateSchema } from '../templates/models/template.schema';
import { Answer, AnswerSchema } from './models/answer.model';
import { TeamSchema } from '../teams/models/team.schema';
import { TeamMemberSchema } from '../teams/models/teamMember.schema';
import { TemplateAreaRelationSchema } from '../areas/models/templateAreaRelation.schema';
import { TemplatesService } from '../templates/templates.service';
import { TemplateAreaRelationService } from '../areas/services/templateAreaRelation.service';
import { TeamsService } from '../teams/services/teams.service';
import { TemplatePermissionsMiddleware } from './middleware/templatePermissions.middleware';
import { S3Service } from './services/s3Service';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';
import { TeamAreaRelationSchema } from '../areas/models/teamAreaRelation.schema';

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
      [{ name: 'areatemplaterelations', schema: TemplateAreaRelationSchema }],
      'apiDb',
    ),
    MongooseModule.forFeature(
      [{ name: 'areateamrelations', schema: TeamAreaRelationSchema }],
      'apiDb',
    ),
  ],
  controllers: [AnswersController],
  providers: [
    TemplatesService,
    TemplateAreaRelationService,
    TeamAreaRelationService,
    AnswersService,
    TeamsService,
    TeamMembersService,
    S3Service,
    UserService,
  ],
})
export class AnswersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TemplatePermissionsMiddleware)
      .exclude('/v3/gfw/templates/:templateId/answers/exports/:id')
      .forRoutes(AnswersController);
  }
}
