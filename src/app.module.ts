import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { AssignmentsModule } from './assignments/assignments.module';
import { RoutesModule } from './routes/routes.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from './common/sentry.interceptor';
import { CommonModule } from './common/common.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    CommonModule,
    TeamsModule,
    TeamMembersModule,
    AreasModule,
    DatabaseModule,
    AnswersModule,
    TemplatesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AssignmentsModule,
    RoutesModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('/v3/gfw/healthcheck')
      .forRoutes('*');
  }
}
