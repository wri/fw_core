import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Route, RouteSchema } from './models/route.schema';
import { TeamsService } from '../teams/services/teams.service';
import { TeamSchema } from '../teams/models/team.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import {
  TeamMember,
  TeamMemberSchema,
} from '../teams/models/teamMember.schema';
import { UserService } from '../common/user.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Route.name, schema: RouteSchema }],
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
  controllers: [RoutesController],
  providers: [RoutesService, TeamsService, TeamMembersService, UserService],
})
export class RoutesModule {}
