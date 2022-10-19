"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsModule = void 0;
const common_1 = require("@nestjs/common");
const assignments_service_1 = require("./assignments.service");
const assignments_controller_1 = require("./assignments.controller");
const mongoose_1 = require("@nestjs/mongoose");
const assignment_schema_1 = require("./models/assignment.schema");
const teams_service_1 = require("../teams/services/teams.service");
const team_schema_1 = require("../teams/models/team.schema");
const teamMembers_service_1 = require("../teams/services/teamMembers.service");
const teamMember_schema_1 = require("../teams/models/teamMember.schema");
const user_service_1 = require("../common/user.service");
let AssignmentsModule = class AssignmentsModule {
};
AssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: assignment_schema_1.Assignment.name, schema: assignment_schema_1.AssignmentSchema }], 'formsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: team_schema_1.Team.name, schema: team_schema_1.TeamSchema }], 'teamsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: teamMember_schema_1.TeamMember.name, schema: teamMember_schema_1.TeamMemberSchema }], 'teamsDb')
        ],
        controllers: [assignments_controller_1.AssignmentsController],
        providers: [
            assignments_service_1.AssignmentsService,
            teams_service_1.TeamsService,
            teamMembers_service_1.TeamMembersService,
            user_service_1.UserService
        ]
    })
], AssignmentsModule);
exports.AssignmentsModule = AssignmentsModule;
//# sourceMappingURL=assignments.module.js.map