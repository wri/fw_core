import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseService } from "./database.service";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: 'apiDb',
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/api?authSource=admin`}),//, connectionName: 'database' }),
            inject: [ConfigService]
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: 'teamsDb',
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/teams?authSource=admin`}),//, connectionName: 'database' }),
            inject: [ConfigService]
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: 'formsDb',
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/forms?authSource=admin`}),//, connectionName: 'database' }),
            inject: [ConfigService]
        })
    ],
    providers: [DatabaseService],
    exports: [DatabaseService]
})
export class DatabaseModule { };