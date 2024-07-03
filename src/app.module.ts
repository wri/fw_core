import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { UserService } from './common/user.service';
import { TeamMembersModule } from './teams/modules/teamMembers.module';
import { TeamsModule } from './teams/modules/teams.module';
import { AreasModule } from './areas/modules/areas.module';
import { DatabaseModule } from './common/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './common/configuration';
import { TemplatesModule } from './templates/templates.module';
import { AnswersModule } from './answers/answers.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { RoutesModule } from './routes/routes.module';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { CommonModule } from './common/common.module';
import { StatisticsModule } from './statistics/statistics.module';
import * as Sentry from '@sentry/node';

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
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        dsn: 'https://a6b18ef7ce1d43298127081511289af7@o163691.ingest.us.sentry.io/4504083459211264',
        debug: true,
        environment: cfg.get('ENV'),
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.OnUncaughtException(),
          new Sentry.Integrations.OnUnhandledRejection(),
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, UserService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('/v3/gfw/healthcheck')
      .forRoutes('*');
  }
}
