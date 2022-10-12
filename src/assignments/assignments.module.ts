import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './models/assignment.schema';
import { TeamsService } from '../teams/services/teams.service';
import { Team, TeamSchema } from '../teams/models/team.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { TeamMember, TeamMemberSchema } from '../teams/models/teamMember.schema';
import { UserService } from '../common/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }], 'formsDb'),
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }], 'teamsDb'),
    MongooseModule.forFeature([{ name: TeamMember.name, schema: TeamMemberSchema }], 'teamsDb')
  ],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService, 
    TeamsService, 
    TeamMembersService,
    UserService
  ]
})
export class AssignmentsModule {}
