import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';
import { TeamsController } from '../controllers/teams.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamSchema } from '../models/team.schema';
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamMemberSchema } from '../models/teamMember.schema';
import { IsAdminOrManagerMiddleware } from '../middleware/isAdminOrManager.middleware';
import { IsAdminMiddleware } from '../middleware/isAdmin.middleware';
import { UserService } from '../../common/user.service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { TeamAreaRelationSchema } from '../../areas/models/teamAreaRelation.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: 'gfwteams', schema: TeamSchema }],
      'teamsDb',
    ),
    MongooseModule.forFeature(
      [{ name: 'teamuserrelations', schema: TeamMemberSchema }],
      'teamsDb',
    ),
    MongooseModule.forFeature(
      [{ name: 'areateamrelations', schema: TeamAreaRelationSchema }],
      'apiDb',
    ),
  ],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    TeamMembersService,
    UserService,
    TeamAreaRelationService,
  ],
  exports: [TeamsService],
})
export class TeamsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsAdminOrManagerMiddleware).forRoutes({
      path: '/teams/:teamId',
      method: RequestMethod.PATCH,
    });
    consumer.apply(IsAdminMiddleware).forRoutes({
      path: '/teams/:teamId',
      method: RequestMethod.DELETE,
    });
  }
}
