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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TeamMembersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamMembersController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const teams_service_1 = require("../services/teams.service");
const teamMembers_service_1 = require("../services/teamMembers.service");
const teamMember_schema_1 = require("../models/teamMember.schema");
const teamMember_serializer_1 = __importDefault(require("../serializers/teamMember.serializer"));
let TeamMembersController = TeamMembersController_1 = class TeamMembersController {
    constructor(teamsService, teamMembersService, teamMemberModel) {
        this.teamsService = teamsService;
        this.teamMembersService = teamMembersService;
        this.teamMemberModel = teamMemberModel;
        this.logger = new common_1.Logger(TeamMembersController_1.name);
    }
    findAllTeamMembers(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggedUser;
            if (request.query && request.query.loggedUser)
                loggedUser = request.query.loggedUser;
            else
                throw new common_1.HttpException('No user found', common_1.HttpStatus.NOT_FOUND);
            const { id: userId } = JSON.parse(loggedUser);
            const { teamId } = params;
            const teamMember = yield this.teamMembersService.findTeamMember(teamId, userId);
            const members = yield this.teamMembersService.findAllTeamMembers(teamId, teamMember.role);
            return { data: (0, teamMember_serializer_1.default)(members) };
        });
    }
    addTeamMembers(members, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { teamId } = params;
            const userEmails = [];
            for (let i = 0; i < members.length; i++) {
                const userEmail = members[i].email;
                if (!userEmails.includes(userEmail)) {
                    userEmails.push(userEmail);
                }
                else
                    throw new common_1.HttpException("Can't have duplicate users on team", common_1.HttpStatus.BAD_REQUEST);
            }
            const duplicateUsers = yield this.teamMemberModel.count({ teamId, email: { $in: userEmails } });
            if (duplicateUsers > 0)
                throw new common_1.HttpException("Can't have duplicate users on team", common_1.HttpStatus.BAD_REQUEST);
            const membersToAdd = members.map(member => {
                return {
                    teamId,
                    email: member.email,
                    role: member.role,
                    status: teamMember_schema_1.EMemberStatus.Invited
                };
            });
            const memberDocuments = yield this.teamMembersService.createMany(membersToAdd);
            return { data: (0, teamMember_serializer_1.default)(memberDocuments) };
        });
    }
    reassignAdmin(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, teamId } = params;
            const { body } = request;
            const { id: loggedUserId } = body.loggedUser;
            const teamUser = yield this.teamMembersService.findTeamMember(teamId, userId);
            const adminUser = yield this.teamMembersService.findTeamMember(teamId, loggedUserId);
            if (!teamUser)
                throw new common_1.HttpException("A user with this id is not a member of this team", common_1.HttpStatus.NOT_FOUND);
            if (!adminUser)
                throw new common_1.HttpException("A user with this id is not the admin of this team", common_1.HttpStatus.NOT_FOUND);
            teamUser.role = teamMember_schema_1.EMemberRole.Administrator;
            adminUser.role = teamMember_schema_1.EMemberRole.Manager;
            yield teamUser.save();
            yield adminUser.save();
            return { data: (0, teamMember_serializer_1.default)(teamUser) };
        });
    }
    updateMemberRole(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { memberId } = params;
            const { body } = request;
            if (body.role === teamMember_schema_1.EMemberRole.Administrator)
                throw new common_1.HttpException("Please use /teams/:teamId/reassignAdmin/:userId to reassign admin", common_1.HttpStatus.BAD_REQUEST);
            const member = yield this.teamMembersService.findById(memberId);
            if (member.role === teamMember_schema_1.EMemberRole.Administrator)
                throw new common_1.HttpException("Can't change the administrator's role", common_1.HttpStatus.BAD_REQUEST);
            if (member.status === teamMember_schema_1.EMemberStatus.Invited || member.status === teamMember_schema_1.EMemberStatus.Declined)
                throw new common_1.HttpException("Can't update a user's role before they have accepted an invitation", common_1.HttpStatus.BAD_REQUEST);
            member.role = body.role;
            yield member.save();
            return { data: (0, teamMember_serializer_1.default)(member) };
        });
    }
    deleteMember(request, params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { memberId, teamId } = params;
            let loggedUser;
            if (request.query && request.query.loggedUser)
                loggedUser = request.query.loggedUser;
            else
                throw new common_1.HttpException('No user found', common_1.HttpStatus.NOT_FOUND);
            const { id: loggedUserId } = JSON.parse(loggedUser);
            const teamMemberToDelete = yield this.teamMembersService.findById(memberId);
            const currentUser = yield this.teamMembersService.findTeamMember(teamId, loggedUserId);
            if (!teamMemberToDelete)
                throw new common_1.HttpException("This team member doesn't exist", common_1.HttpStatus.NOT_FOUND);
            const authorised = teamMemberToDelete &&
                (currentUser.role === teamMember_schema_1.EMemberRole.Administrator ||
                    currentUser.role === teamMember_schema_1.EMemberRole.Manager ||
                    ((_a = teamMemberToDelete.userId) === null || _a === void 0 ? void 0 : _a.toString()) === loggedUserId);
            if (!authorised)
                throw new common_1.HttpException("You are not authorized to remove this user from this team", common_1.HttpStatus.FORBIDDEN);
            if (teamMemberToDelete.role === teamMember_schema_1.EMemberRole.Administrator)
                throw new common_1.HttpException("Can't remove the administrator", common_1.HttpStatus.BAD_REQUEST);
            yield this.teamMembersService.remove(memberId);
            return;
        });
    }
    acceptInvitation(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, teamId } = params;
            const { body } = request;
            const { id: loggedUserId, email: loggedEmail } = body.loggedUser;
            if (userId !== loggedUserId)
                throw new common_1.HttpException('Login with the correct user', common_1.HttpStatus.FORBIDDEN);
            const updatedMember = yield this.teamMembersService.update(teamId, loggedEmail, {
                userId: loggedUserId,
                status: teamMember_schema_1.EMemberStatus.Confirmed
            });
            return { data: (0, teamMember_serializer_1.default)(updatedMember) };
        });
    }
    ;
    declineInvitation(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, teamId } = params;
            const { body } = request;
            const { id: loggedUserId, email: loggedEmail } = body.loggedUser;
            if (userId !== loggedUserId)
                throw new common_1.HttpException('Login with the correct user', common_1.HttpStatus.FORBIDDEN);
            const updatedMember = yield this.teamMembersService.update(teamId, loggedEmail, {
                userId: loggedUserId,
                status: teamMember_schema_1.EMemberStatus.Declined
            });
            return { data: (0, teamMember_serializer_1.default)(updatedMember) };
        });
    }
    ;
    leaveTeam(request, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { teamId, userId } = params;
            const { body } = request;
            const { id: loggedUserId, email: loggedEmail } = body.loggedUser;
            if (userId !== loggedUserId)
                throw new common_1.HttpException('Login with the correct user', common_1.HttpStatus.FORBIDDEN);
            const teamMember = yield this.teamMembersService.findTeamMember(teamId, userId);
            if (teamMember && teamMember.role === teamMember_schema_1.EMemberRole.Administrator)
                throw new common_1.HttpException("Administrator can't leave team", common_1.HttpStatus.BAD_REQUEST);
            const updatedMember = yield this.teamMembersService.update(teamId, loggedEmail, {
                role: teamMember_schema_1.EMemberRole.Left
            });
            return { data: (0, teamMember_serializer_1.default)(updatedMember) };
        });
    }
    ;
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "findAllTeamMembers", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "addTeamMembers", null);
__decorate([
    (0, common_1.Patch)('/reassignAdmin/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "reassignAdmin", null);
__decorate([
    (0, common_1.Patch)('/:memberId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Delete)('/:memberId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "deleteMember", null);
__decorate([
    (0, common_1.Patch)('/:userId/accept'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Patch)('/:userId/decline'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "declineInvitation", null);
__decorate([
    (0, common_1.Patch)('/:userId/leave'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamMembersController.prototype, "leaveTeam", null);
TeamMembersController = TeamMembersController_1 = __decorate([
    (0, common_1.Controller)('teams/:teamId/users'),
    __param(2, (0, mongoose_1.InjectModel)(teamMember_schema_1.TeamMember.name, 'teamsDb')),
    __metadata("design:paramtypes", [teams_service_1.TeamsService,
        teamMembers_service_1.TeamMembersService,
        mongoose_2.Model])
], TeamMembersController);
exports.TeamMembersController = TeamMembersController;
//# sourceMappingURL=teamMembers.controller.js.map