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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswersService = void 0;
const common_1 = require("@nestjs/common");
const answer_model_1 = require("../models/answer.model");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const teamMember_schema_1 = require("../../teams/models/teamMember.schema");
const teamMembers_service_1 = require("../../teams/services/teamMembers.service");
const mongoose_3 = __importDefault(require("mongoose"));
const user_service_1 = require("../../common/user.service");
const template_schema_1 = require("../../templates/models/template.schema");
const teams_service_1 = require("../../teams/services/teams.service");
const teamAreaRelation_service_1 = require("../../areas/services/teamAreaRelation.service");
let AnswersService = class AnswersService {
    constructor(templateModel, answerModel, teamMembersService, teamsService, teamAreaRelationService, userService) {
        this.templateModel = templateModel;
        this.answerModel = answerModel;
        this.teamMembersService = teamMembersService;
        this.teamsService = teamsService;
        this.teamAreaRelationService = teamAreaRelationService;
        this.userService = userService;
    }
    create(answer) {
        return __awaiter(this, void 0, void 0, function* () {
            const answerToSave = new this.answerModel(answer);
            const savedAnswer = yield answerToSave.save();
            return yield this.addUsernameToAnswer(savedAnswer);
        });
    }
    getAllTemplateAnswers({ template, user }) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let filter = {};
            const confirmedUsers = [];
            confirmedUsers.push(user.id);
            let teamsManaged = yield this.teamsService.findAllManagedTeams(user.id);
            try {
                for (var teamsManaged_1 = __asyncValues(teamsManaged), teamsManaged_1_1; teamsManaged_1_1 = yield teamsManaged_1.next(), !teamsManaged_1_1.done;) {
                    const team = teamsManaged_1_1.value;
                    const users = yield this.teamMembersService.findAllTeamMembers(team, teamMember_schema_1.EMemberRole.Administrator);
                    confirmedUsers.push(...users.map(user => user.userId));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (teamsManaged_1_1 && !teamsManaged_1_1.done && (_a = teamsManaged_1.return)) yield _a.call(teamsManaged_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (user.role === "ADMIN" || user.id === template.user) {
                filter = {
                    $and: [{ report: template._id }]
                };
            }
            else if (teamsManaged.length > 0) {
                filter = {
                    $and: [{ report: template._id }, { user: { $in: confirmedUsers } }]
                };
            }
            else {
                filter = {
                    $and: [{ report: template._id }, { user: new mongoose_3.default.Types.ObjectId(user.id) }]
                };
            }
            return yield this.addUsernameToAnswers(yield this.answerModel.find(filter));
        });
    }
    getAllAnswers({ loggedUser, teams }) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let filter = {};
            let teamsManaged = [];
            const confirmedUsers = [];
            if (teams.length > 0) {
                teamsManaged = teams.filter(team => team.userRole === teamMember_schema_1.EMemberRole.Manager || team.userRole === teamMember_schema_1.EMemberRole.Administrator);
                if (teamsManaged.length > 0) {
                    try {
                        for (var teamsManaged_2 = __asyncValues(teamsManaged), teamsManaged_2_1; teamsManaged_2_1 = yield teamsManaged_2.next(), !teamsManaged_2_1.done;) {
                            const team = teamsManaged_2_1.value;
                            const teamUsers = yield this.teamMembersService.findAllTeamMembers(team.id, teamMember_schema_1.EMemberRole.Administrator);
                            if (teamUsers)
                                confirmedUsers.push(...teamUsers.map(teamUser => new mongoose_3.default.Types.ObjectId(teamUser.userId)));
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (teamsManaged_2_1 && !teamsManaged_2_1.done && (_a = teamsManaged_2.return)) yield _a.call(teamsManaged_2);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            confirmedUsers.push(new mongoose_3.default.Types.ObjectId(loggedUser.id));
            filter = { user: { $in: confirmedUsers } };
            let answers = yield this.answerModel.find(filter);
            return yield this.addUsernameToAnswers(answers);
        });
    }
    filterAnswersByArea({ reportId, teams, areaId, loggedUser, restricted }) {
        var e_3, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const areaTeamsRelations = yield this.teamAreaRelationService.find({ areaId });
            const areaTeams = areaTeamsRelations.map(relation => relation.teamId.toString());
            const filteredTeams = teams.filter(team => areaTeams.includes(team.id.toString()));
            let userIds = [];
            if (!restricted && filteredTeams.length > 0) {
                try {
                    for (var filteredTeams_1 = __asyncValues(filteredTeams), filteredTeams_1_1; filteredTeams_1_1 = yield filteredTeams_1.next(), !filteredTeams_1_1.done;) {
                        const team = filteredTeams_1_1.value;
                        const users = yield this.teamMembersService.findAllTeamMembers(team.id, teamMember_schema_1.EMemberRole.Administrator);
                        userIds.push(...users.map(user => user.userId));
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (filteredTeams_1_1 && !filteredTeams_1_1.done && (_a = filteredTeams_1.return)) yield _a.call(filteredTeams_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            else
                userIds.push(loggedUser.id);
            let filter = {
                $and: [{ report: new mongoose_3.default.Types.ObjectId(reportId) }, { user: { $in: userIds } }, { areaOfInterest: areaId }]
            };
            let answers = yield this.answerModel.find(filter);
            return yield this.addUsernameToAnswers(answers);
        });
    }
    findSome(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.answerModel.find(filter);
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.answerModel.findOne(filter);
        });
    }
    update(id, updateAnswerDto) {
        return `This action updates a #${id} answer`;
    }
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.answerModel.deleteMany(filter);
        });
    }
    addUsernameToAnswer(answer) {
        return __awaiter(this, void 0, void 0, function* () {
            answer.fullName = yield this.userService.getNameByIdMICROSERVICE(answer.user);
            return answer;
        });
    }
    addUsernameToAnswers(answers) {
        var answers_1, answers_1_1;
        var e_4, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (answers_1 = __asyncValues(answers); answers_1_1 = yield answers_1.next(), !answers_1_1.done;) {
                    let answer = answers_1_1.value;
                    answer = yield this.addUsernameToAnswer(answer);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (answers_1_1 && !answers_1_1.done && (_a = answers_1.return)) yield _a.call(answers_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return answers;
        });
    }
    ;
};
AnswersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(template_schema_1.Template.name, 'formsDb')),
    __param(1, (0, mongoose_2.InjectModel)(answer_model_1.Answer.name, 'formsDb')),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        teamMembers_service_1.TeamMembersService,
        teams_service_1.TeamsService,
        teamAreaRelation_service_1.TeamAreaRelationService,
        user_service_1.UserService])
], AnswersService);
exports.AnswersService = AnswersService;
//# sourceMappingURL=answers.service.js.map