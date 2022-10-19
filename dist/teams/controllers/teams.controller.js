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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TeamsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const teams_service_1 = require("../services/teams.service");
const teamMembers_service_1 = require("../services/teamMembers.service");
const teamMember_schema_1 = require("../models/teamMember.schema");
const team_serializer_1 = __importDefault(require("../serializers/team.serializer"));
const teamAreaRelation_service_1 = require("../../areas/services/teamAreaRelation.service");
let TeamsController = TeamsController_1 = class TeamsController {
    constructor(teamsService, teamMembersService, teamAreaRelationService) {
        this.teamsService = teamsService;
        this.teamMembersService = teamMembersService;
        this.teamAreaRelationService = teamAreaRelationService;
        this.logger = new common_1.Logger(TeamsController_1.name);
    }
    findMyInvites(request, params) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let loggedUser;
            if (request.query && request.query.loggedUser)
                loggedUser = request.query.loggedUser;
            else
                throw new common_1.HttpException('No user found', common_1.HttpStatus.NOT_FOUND);
            const { email: loggedEmail } = JSON.parse(loggedUser);
            const teams = yield this.teamsService.findAllInvites(loggedEmail);
            const teamsToSend = [];
            try {
                for (var teams_1 = __asyncValues(teams), teams_1_1; teams_1_1 = yield teams_1.next(), !teams_1_1.done;) {
                    const team = teams_1_1.value;
                    const teamId = team._id;
                    const members = yield this.teamMembersService.findAllTeamMembers(teamId, teamMember_schema_1.EMemberRole.Monitor);
                    team.members = members;
                    const areas = yield this.teamAreaRelationService.find({ teamId });
                    if (areas)
                        team.areas = areas.map(area => area.areaId);
                    else
                        team.areas = [];
                    teamsToSend.push(team);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (teams_1_1 && !teams_1_1.done && (_a = teams_1.return)) yield _a.call(teams_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return { data: (0, team_serializer_1.default)(teamsToSend) };
        });
    }
    getTeam(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { teamId } = params;
            const team = yield this.teamsService.findById(teamId);
            return { data: (0, team_serializer_1.default)(team) };
        });
    }
    ;
    getUserTeams(request, params) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = params;
            let loggedUser;
            if (request.query && request.query.loggedUser)
                loggedUser = request.query.loggedUser;
            else
                throw new common_1.HttpException('No user found', common_1.HttpStatus.NOT_FOUND);
            const { id: userId } = JSON.parse(loggedUser);
            const teams = yield this.teamsService.findAllByUserId(id);
            const filteredTeams = teams.filter(team => team.userRole !== teamMember_schema_1.EMemberRole.Left);
            const teamsToSend = [];
            try {
                for (var filteredTeams_1 = __asyncValues(filteredTeams), filteredTeams_1_1; filteredTeams_1_1 = yield filteredTeams_1.next(), !filteredTeams_1_1.done;) {
                    const team = filteredTeams_1_1.value;
                    const teamId = team._id;
                    const teamUserRelation = yield this.teamMembersService.findTeamMember(teamId, userId);
                    const members = yield this.teamMembersService.findAllTeamMembers(teamId, teamUserRelation.role);
                    team.members = members;
                    const areas = yield this.teamAreaRelationService.find({ teamId });
                    if (areas)
                        team.areas = areas.map(area => area.areaId);
                    else
                        team.areas = [];
                    teamsToSend.push(team);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (filteredTeams_1_1 && !filteredTeams_1_1.done && (_a = filteredTeams_1.return)) yield _a.call(filteredTeams_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return { data: (0, team_serializer_1.default)(teamsToSend) };
        });
    }
    ;
    create(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body } = request;
            if (!body.name)
                throw new common_1.HttpException("Team must have a name", common_1.HttpStatus.BAD_REQUEST);
            const team = yield this.teamsService.create(body.name, body.loggedUser);
            return { data: (0, team_serializer_1.default)(team) };
        });
    }
    updateTeam(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { teamId } = params;
            const { body } = request;
            const team = yield this.teamsService.update(teamId, body.name);
            return { data: (0, team_serializer_1.default)(team) };
        });
    }
    ;
    deleteTeam(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { teamId } = params;
            yield this.teamsService.delete(teamId);
            return null;
        });
    }
    ;
};
__decorate([
    (0, common_1.Get)('/myinvites'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "findMyInvites", null);
__decorate([
    (0, common_1.Get)('/:teamId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getTeam", null);
__decorate([
    (0, common_1.Get)('/user/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getUserTeams", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('/:teamId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "updateTeam", null);
__decorate([
    (0, common_1.Delete)('/:teamId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "deleteTeam", null);
TeamsController = TeamsController_1 = __decorate([
    (0, common_1.Controller)('teams'),
    __metadata("design:paramtypes", [teams_service_1.TeamsService,
        teamMembers_service_1.TeamMembersService,
        teamAreaRelation_service_1.TeamAreaRelationService])
], TeamsController);
exports.TeamsController = TeamsController;
//# sourceMappingURL=teams.controller.js.map