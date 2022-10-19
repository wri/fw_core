"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_middleware_1 = require("./common/middleware/auth.middleware");
const user_service_1 = require("./common/user.service");
const teamMembers_module_1 = require("./teams/modules/teamMembers.module");
const teams_module_1 = require("./teams/modules/teams.module");
const areas_module_1 = require("./areas/modules/areas.module");
const database_module_1 = require("./common/database/database.module");
const config_1 = require("@nestjs/config");
const configuration_1 = __importDefault(require("./common/configuration"));
const templates_module_1 = require("./templates/templates.module");
const answers_module_1 = require("./answers/answers.module");
const assignments_module_1 = require("./assignments/assignments.module");
const routes_module_1 = require("./routes/routes.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(auth_middleware_1.AuthMiddleware)
            .forRoutes('*');
    }
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            teams_module_1.TeamsModule,
            teamMembers_module_1.TeamMembersModule,
            areas_module_1.AreasModule,
            database_module_1.DatabaseModule,
            templates_module_1.TemplatesModule,
            answers_module_1.AnswersModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default]
            }),
            assignments_module_1.AssignmentsModule,
            routes_module_1.RoutesModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, user_service_1.UserService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map