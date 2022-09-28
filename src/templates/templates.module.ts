import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { AnswersService } from '../answers/answers.service';
import { TeamsService } from '../teams/services/teams.service';
import { UserService } from '../common/user.service';
import { CreateTemplateMiddleware } from './validator.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './models/template.schema';
import { Answer, AnswerSchema } from '../answers/models/answer.model';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { Team, TeamSchema } from '../teams/models/team.schema';
import { TeamMember, TeamMemberSchema } from '../teams/models/teamMember.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }], 'formsDb'),
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }], 'formsDb'),
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }], 'teamsDb'),
    MongooseModule.forFeature([{ name: TeamMember.name, schema: TeamMemberSchema }], 'teamsDb'),
  ],
  controllers: [TemplatesController],
  providers: [
    TemplatesService, 
    AnswersService, 
    TeamsService,
    TeamMembersService,
    UserService]
})
export class TemplatesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CreateTemplateMiddleware)
      .forRoutes(
        {
          path: '/templates',
          method: RequestMethod.POST
        }
      )
  }
}
