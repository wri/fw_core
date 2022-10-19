"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamMembersModule = void 0;
const common_1 = require("@nestjs/common");
const teams_service_1 = require("../services/teams.service");
const teamMembers_controller_1 = require("../controllers/teamMembers.controller");
const mongoose_1 = require("@nestjs/mongoose");
const team_schema_1 = require("../models/team.schema");
const teamMembers_service_1 = require("../services/teamMembers.service");
const teamMember_schema_1 = require("../models/teamMember.schema");
const isAdmin_middleware_1 = require("../middleware/isAdmin.middleware");
const isTeamMember_middleware_1 = require("../middleware/isTeamMember.middleware");
const isAdminOrManager_middleware_1 = require("../middleware/isAdminOrManager.middleware");
const user_service_1 = require("../../common/user.service");
let TeamMembersModule = class TeamMembersModule {
    configure(consumer) {
        consumer
            .apply(isAdmin_middleware_1.IsAdminMiddleware)
            .forRoutes({
            path: '/teams/:teamId/users',
            method: common_1.RequestMethod.POST
        }, '/teams/:teamId/users/reassignAdmin/:userId');
        consumer
            .apply(isAdminOrManager_middleware_1.IsAdminOrManagerMiddleware)
            .forRoutes({ path: '/teams/:teamId/users/:memberId',
            method: common_1.RequestMethod.PATCH });
        consumer
            .apply(isTeamMember_middleware_1.IsTeamMemberMiddleware)
            .forRoutes({
            path: '/teams/:teamId/users',
            method: common_1.RequestMethod.GET
        }, { path: '/teams/:teamId/users/:memberId',
            method: common_1.RequestMethod.DELETE });
    }
};
TeamMembersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: team_schema_1.Team.name, schema: team_schema_1.TeamSchema }], 'teamsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: teamMember_schema_1.TeamMember.name, schema: teamMember_schema_1.TeamMemberSchema }], 'teamsDb')
        ],
        controllers: [teamMembers_controller_1.TeamMembersController],
        providers: [teams_service_1.TeamsService, teamMembers_service_1.TeamMembersService, user_service_1.UserService]
    })
], TeamMembersModule);
exports.TeamMembersModule = TeamMembersModule;
//# sourceMappingURL=teamMembers.module.js.map