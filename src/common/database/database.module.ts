import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseService } from "./database.service";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({ uri: `mongodb://${configService.get('mongodb.secret.username')}:${configService.get('mongodb.secret.password')}@${configService.get('mongodb.host')}:${configService.get('mongodb.port')}/${configService.get('mongodb.database')}?authSource=admin` }),
            inject: [ConfigService]
        }),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService]
})
export class DatabaseModule { };