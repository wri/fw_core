import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { AnswersService } from '../answers/answers.service';
import { TeamsService } from '../teams/services/teams.service';
import { UserService } from '../common/user.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, AnswersService, TeamsService, UserService]
})
export class TemplatesModule {}
