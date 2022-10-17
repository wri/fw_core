import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';
import { TeamMembersController } from '../controllers/teamMembers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from '../models/team.schema';
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamMember, TeamMemberSchema } from '../models/teamMember.schema';
import { IsAdminMiddleware } from '../middleware/isAdmin.middleware';
import { IsTeamMemberMiddleware } from '../middleware/isTeamMember.middleware';
import { IsAdminOrManagerMiddleware } from '../middleware/isAdminOrManager.middleware';
import { UserService } from '../../common/user.service';
import { DatabaseModule } from '../../common/database/database.module';
import { DatabaseService } from 'src/common/database/database.service';

@Module({
  imports: [
    MongooseModule.forFeature([{name: "gfwteams", schema: TeamSchema}], 'teamsDb'),
    MongooseModule.forFeature([{name: 'teamuserrelations', schema: TeamMemberSchema}], 'teamsDb')
  ],
  controllers: [TeamMembersController],
  providers: [TeamsService, TeamMembersService, UserService]
})
export class TeamMembersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(IsAdminMiddleware)
    .forRoutes(
      {
        path: '/teams/:teamId/users',
        method: RequestMethod.POST
      },
      '/teams/:teamId/users/reassignAdmin/:userId'
    )
    consumer
    .apply(IsAdminOrManagerMiddleware)
    .forRoutes(
      {path: '/teams/:teamId/users/:memberId',
      method: RequestMethod.PATCH}
    )
    consumer
    .apply(IsTeamMemberMiddleware)
    .forRoutes(
      {
        path: '/teams/:teamId/users',
        method: RequestMethod.GET
      },
      {path: '/teams/:teamId/users/:memberId',
      method: RequestMethod.DELETE}
    )
  }
}
