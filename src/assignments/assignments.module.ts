import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './models/assignment.schema';
import { TeamsService } from '../teams/services/teams.service';
import { TeamSchema } from '../teams/models/team.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { TeamMemberSchema } from '../teams/models/teamMember.schema';
import { UserService } from '../common/user.service';
import { ConfigService } from '@nestjs/config';
import { AreasModule } from '../areas/modules/areas.module';
import { S3Service } from '../answers/services/s3Service';
import { TemplatesService } from '../templates/templates.service';
import { TemplatesModule } from '../templates/templates.module';

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
    AreasModule,
    TemplatesModule,
  ],
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    TeamsService,
    TeamMembersService,
    UserService,
    ConfigService,
    S3Service,
    TemplatesService,
  ],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
