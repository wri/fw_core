import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';
import { TeamsController } from '../controllers/teams.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from '../models/team.schema';
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamMember, TeamMemberSchema } from '../models/teamMember.schema';
import { IsAdminOrManagerMiddleware } from '../middleware/isAdminOrManager.middleware';
import { IsAdminMiddleware } from '../middleware/isAdmin.middleware';
import { UserService } from '../../common/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
    MongooseModule.forFeature([{ name: TeamMember.name, schema: TeamMemberSchema }])
  ],
  controllers: [TeamsController],
  providers: [TeamsService, TeamMembersService, UserService]
})
export class TeamsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IsAdminOrManagerMiddleware)
      .forRoutes(
        {
          path: '/teams/:teamId',
          method: RequestMethod.PATCH
        }
      )
    consumer
      .apply(IsAdminMiddleware)
      .forRoutes(
        {
          path: '/teams/:teamId',
          method: RequestMethod.DELETE
        }
      )
  }
}
