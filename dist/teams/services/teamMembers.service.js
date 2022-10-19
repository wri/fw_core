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
var TeamMembersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamMembersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_service_1 = require("../../common/user.service");
const teamMember_schema_1 = require("../models/teamMember.schema");
const mongoose_3 = __importDefault(require("mongoose"));
let TeamMembersService = TeamMembersService_1 = class TeamMembersService {
    constructor(teamMemberModel, userService) {
        this.teamMemberModel = teamMemberModel;
        this.userService = userService;
        this.logger = new common_1.Logger(TeamMembersService_1.name);
    }
    static findById(memberId) {
        throw new Error('Method not implemented.');
    }
    create(createTeamMemberDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const createdTeamMember = new this.teamMemberModel(createTeamMemberDto);
            return createdTeamMember.save();
        });
    }
    createMany(teamMembersToAdd) {
        return this.teamMemberModel.insertMany(teamMembersToAdd);
    }
    findTeamMember(teamId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findFullNameForTeamMember(yield this.teamMemberModel.findOne({
                teamId,
                userId
            }));
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findFullNameForTeamMember(yield this.teamMemberModel.findById(id));
        });
    }
    findAllTeamMembers(teamId, teamUserRole) {
        return __awaiter(this, void 0, void 0, function* () {
            if (teamUserRole === teamMember_schema_1.EMemberRole.Administrator || teamUserRole === teamMember_schema_1.EMemberRole.Manager) {
                return this.findFullNameForTeamMembers(yield this.teamMemberModel.find({ teamId }));
            }
            else {
                return this.findFullNameForTeamMembers(yield this.teamMemberModel.find({ teamId }).select("-status"));
            }
        });
    }
    findAllByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId)
                return [];
            else
                return this.findFullNameForTeamMembers(yield this.teamMemberModel.find({
                    userId: new mongoose_3.default.Types.ObjectId(userId)
                }));
        });
    }
    findAllInvitesByUserEmail(userEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findFullNameForTeamMembers(yield this.teamMemberModel.find({
                email: userEmail,
                status: teamMember_schema_1.EMemberStatus.Invited
            }));
        });
    }
    update(teamId, userEmail, update) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.teamMemberModel.findOneAndUpdate({ teamId, email: userEmail }, update, { new: true });
        });
    }
    remove(teamUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.teamMemberModel.findByIdAndDelete(teamUserId);
        });
    }
    findFullNameForTeamMember(teamMember) {
        return __awaiter(this, void 0, void 0, function* () {
            if (teamMember) {
                const name = yield this.userService.getNameByIdMICROSERVICE(teamMember.userId);
                teamMember.name = name;
            }
            return teamMember;
        });
    }
    findFullNameForTeamMembers(teamMembers) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(teamMembers.map((teamMember) => __awaiter(this, void 0, void 0, function* () { return this.findFullNameForTeamMember(teamMember); })));
        });
    }
    removeAllUsersOnTeam(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.teamMemberModel.deleteMany({
                teamId: new mongoose_3.default.Types.ObjectId(teamId)
            });
        });
    }
};
TeamMembersService = TeamMembersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(teamMember_schema_1.TeamMember.name, 'teamsDb')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        user_service_1.UserService])
], TeamMembersService);
exports.TeamMembersService = TeamMembersService;
//# sourceMappingURL=teamMembers.service.js.map