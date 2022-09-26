import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { UserService } from '../common/user.service';

@Module({
  controllers: [AnswersController],
  providers: [AnswersService, TeamMembersService, UserService]
})
export class AnswersModule {}
