import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { UserService } from '../common/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from '../templates/models/template.schema';
import { Answer, AnswerSchema } from './models/answer.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }], 'formsDb'),
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }], 'formsDb')
  ],
  controllers: [AnswersController],
  providers: [AnswersService, TeamMembersService, UserService]
})
export class AnswersModule {}
