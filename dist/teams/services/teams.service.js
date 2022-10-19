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
var TeamsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const team_schema_1 = require("../models/team.schema");
const teamMember_schema_1 = require("../models/teamMember.schema");
const teamMembers_service_1 = require("./teamMembers.service");
let TeamsService = TeamsService_1 = class TeamsService {
    constructor(teamModel, teamMembersService) {
        this.teamModel = teamModel;
        this.teamMembersService = teamMembersService;
        this.logger = new common_1.Logger(TeamsService_1.name);
    }
    create(name, loggedUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id: userId, email: userEmail } = loggedUser;
            const team = yield new this.teamModel({ name }).save();
            const teamMember = {
                teamId: team.id,
                userId: userId,
                email: userEmail,
                role: teamMember_schema_1.EMemberRole.Administrator,
                status: teamMember_schema_1.EMemberStatus.Confirmed
            };
            yield this.teamMembersService.create(teamMember);
            return team;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.teamModel.findById(id);
        });
    }
    findAllByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const teamMembers = yield this.teamMembersService.findAllByUserId(userId);
            return yield this.findAllByTeamUserRelations(teamMembers);
        });
    }
    findAllInvites(userEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const teamMembers = yield this.teamMembersService.findAllInvitesByUserEmail(userEmail);
            return yield this.findAllByTeamUserRelations(teamMembers);
        });
    }
    findAllByTeamUserRelations(teamMembers) {
        return __awaiter(this, void 0, void 0, function* () {
            const teams = [];
            for (let i = 0; i < teamMembers.length; i++) {
                const teamMember = teamMembers[i];
                const team = yield this.findById(teamMember.teamId);
                team.userRole = teamMember.role;
                teams.push(team);
            }
            return teams;
        });
    }
    update(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.teamModel.findByIdAndUpdate(id, { name }, { new: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.teamModel.findByIdAndDelete(id);
            yield this.teamMembersService.removeAllUsersOnTeam(id);
        });
    }
    findAllManagedTeams(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const teams = yield this.teamMembersService.findAllByUserId(userId);
            const teamsManaged = teams.filter(team => team.role === teamMember_schema_1.EMemberRole.Manager || team.role === teamMember_schema_1.EMemberRole.Administrator);
            return teamsManaged.map(team => team.teamId);
        });
    }
};
TeamsService = TeamsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(team_schema_1.Team.name, 'teamsDb')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        teamMembers_service_1.TeamMembersService])
], TeamsService);
exports.TeamsService = TeamsService;
//# sourceMappingURL=teams.service.js.map