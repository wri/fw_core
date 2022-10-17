import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseService } from "./database.service";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: 'apiDb',
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/fw_api_db?authSource=admin`}),//, connectionName: 'database' }),
            inject: [ConfigService]
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: 'teamsDb',
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/fw_teams_db?authSource=admin`}),//, connectionName: 'database' }),
            inject: [ConfigService]
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            connectionName: 'formsDb',
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/gfw_forms?authSource=admin`}),//, connectionName: 'database' }),
            inject: [ConfigService]
        })
    ],
    providers: [DatabaseService],
    exports: [DatabaseService]
})
export class DatabaseModule { };