import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './common/auth.middleware';
import { UserService } from './common/user.service';
import { TeamMembersModule } from './teams/modules/teamMembers.module';
import { TeamsModule } from './teams/modules/teams.module';
import { AreasModule } from './areas/modules/areas.module';
import { DatabaseModule } from './common/database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/configuration';

@Module({
  imports: [
    TeamsModule,
    TeamMembersModule,
    AreasModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    })
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
