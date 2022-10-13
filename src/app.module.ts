import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { UserService } from './common/user.service';
import { TeamMembersModule } from './teams/modules/teamMembers.module';
import { TeamsModule } from './teams/modules/teams.module';
import { AreasModule } from './areas/modules/areas.module';
import { DatabaseModule } from './common/database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/configuration';
import { TemplatesModule } from './templates/templates.module';
import { AnswersModule } from './answers/answers.module';
import { IdCheckMiddleware } from './common/middleware/idCheck.middleware';
import { AssignmentsModule } from './assignments/assignments.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    TeamsModule,
    TeamMembersModule,
    AreasModule,
    DatabaseModule,
    TemplatesModule,
    AnswersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    AssignmentsModule,
    RoutesModule
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(AuthMiddleware)
    .forRoutes('*')
  }
}
