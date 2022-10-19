"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsTeamMemberMiddleware = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const teamMembers_service_1 = require("../services/teamMembers.service");
const teamMember_schema_1 = require("../models/teamMember.schema");
const team_schema_1 = require("../models/team.schema");
let IsTeamMemberMiddleware = class IsTeamMemberMiddleware {
    constructor(teamMembersService, teamMemberModel, teamModel) {
        this.teamMembersService = teamMembersService;
        this.teamMemberModel = teamMemberModel;
        this.teamModel = teamModel;
    }
    use(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { teamId } = req.params;
            const { body, query } = req;
            const { id: userId } = body.loggedUser || JSON.parse(query.loggedUser);
            const numOfTeams = yield this.teamModel.count({ _id: teamId });
            if (numOfTeams === 0)
                throw new common_1.HttpException(`Team not found with id: ${teamId}`, common_1.HttpStatus.NOT_FOUND);
            const teamMember = yield this.teamMembersService.findTeamMember(teamId, userId);
            if (!teamMember || teamMember.role === teamMember_schema_1.EMemberRole.Left)
                throw new common_1.HttpException("Authenticated User must be the Administrator or Manager of the team", common_1.HttpStatus.FORBIDDEN);
            else
                yield next();
        });
    }
};
IsTeamMemberMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(teamMember_schema_1.TeamMember.name, 'teamsDb')),
    __param(2, (0, mongoose_1.InjectModel)(team_schema_1.Team.name, 'teamsDb')),
    __metadata("design:paramtypes", [teamMembers_service_1.TeamMembersService,
        mongoose_2.Model,
        mongoose_2.Model])
], IsTeamMemberMiddleware);
exports.IsTeamMemberMiddleware = IsTeamMemberMiddleware;
;
//# sourceMappingURL=isTeamMember.middleware.js.map