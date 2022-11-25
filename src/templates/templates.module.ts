import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { UserService } from '../common/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateSchema } from './models/template.schema';
import { AreasModule } from '../areas/modules/areas.module';
import { AnswersModule } from '../answers/answers.module';
import { TeamsModule } from '../teams/modules/teams.module';
import { TeamMembersModule } from '../teams/modules/teamMembers.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: 'reports', schema: TemplateSchema }],
      'formsDb',
    ),
    AnswersModule,
    AreasModule,
    TeamsModule,
    TeamMembersModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, UserService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
