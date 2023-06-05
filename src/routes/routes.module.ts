import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Route, RouteSchema } from './models/route.schema';
import { TeamsService } from '../teams/services/teams.service';
import { Team, TeamSchema } from '../teams/models/team.schema';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { TeamMemberSchema } from '../teams/models/teamMember.schema';
import { UserService } from '../common/user.service';
import { TeamsModule } from '../teams/modules/teams.module';

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
    TeamsModule,
  ],
  controllers: [RoutesController],
  providers: [RoutesService, UserService],
})
export class RoutesModule {}
