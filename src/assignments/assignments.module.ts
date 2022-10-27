import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './models/assignment.schema';
import { TeamsService } from '../teams/services/teams.service';
import { Team, TeamSchema } from '../teams/models/team.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import {
  TeamMember,
  TeamMemberSchema,
} from '../teams/models/teamMember.schema';
import { UserService } from '../common/user.service';
import { AreasService } from '../areas/services/areas.service';
import { GeostoreService } from '../areas/services/geostore.service';
import { CoverageService } from '../areas/services/coverage.service';
import { DatasetService } from '../areas/services/dataset.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Assignment.name, schema: AssignmentSchema }],
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
  ],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    TeamsService,
    TeamMembersService,
    UserService,
    AreasService,
    GeostoreService,
    CoverageService,
    DatasetService,
    ConfigService,
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
