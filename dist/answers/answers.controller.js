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
exports.AnswersController = void 0;
const common_1 = require("@nestjs/common");
const answers_service_1 = require("./services/answers.service");
const create_answer_dto_1 = require("./dto/create-answer.dto");
const update_answer_dto_1 = require("./dto/update-answer.dto");
const answers_serializer_1 = __importDefault(require("./serializers/answers.serializer"));
const teamMembers_service_1 = require("../teams/services/teamMembers.service");
const teamMember_schema_1 = require("../teams/models/teamMember.schema");
const mongoose_1 = __importDefault(require("mongoose"));
const platform_express_1 = require("@nestjs/platform-express");
const s3Service_1 = require("./services/s3Service");
const teamAreaRelation_service_1 = require("../areas/services/teamAreaRelation.service");
let AnswersController = class AnswersController {
    constructor(answersService, teamMembersService, teamAreaRelationService, s3Service) {
        this.answersService = answersService;
        this.teamMembersService = teamMembersService;
        this.teamAreaRelationService = teamAreaRelationService;
        this.s3Service = s3Service;
    }
    create(fileArray, fields, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, template } = request;
            let userPosition = [];
            let files = {};
            if (fileArray)
                fileArray.forEach(file => files[file.fieldname] = file);
            try {
                userPosition = fields.userPosition ? fields.userPosition.split(",") : [];
            }
            catch (e) {
                throw new common_1.HttpException(`Position values must be separated by ','`, common_1.HttpStatus.BAD_REQUEST);
            }
            const answer = {
                report: template.id,
                reportName: fields.reportName,
                areaOfInterest: fields.areaOfInterest,
                areaOfInterestName: fields.areaOfInterestName,
                language: fields.language,
                userPosition,
                clickedPosition: JSON.parse(fields.clickedPosition),
                user: user.id,
                createdAt: fields.date,
                responses: []
            };
            if (fields.teamId)
                answer.teamId = fields.teamId.toString();
            const pushResponse = (question, response) => {
                answer.responses.push({
                    name: question.name,
                    value: typeof response !== "undefined" ? response : null
                });
            };
            const pushError = question => {
                throw new common_1.HttpException(`${question.label[answer.language]} (${question.name}) required`, common_1.HttpStatus.BAD_REQUEST);
            };
            const { questions } = template;
            if (!questions || (questions && !questions.length)) {
                throw new common_1.HttpException(`No question associated with this report`, common_1.HttpStatus.BAD_REQUEST);
            }
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                let fileAnswer;
                const bodyAnswer = fields[question.name];
                if (files)
                    fileAnswer = files[question.name];
                let response = typeof bodyAnswer !== "undefined" ? bodyAnswer : fileAnswer;
                if (!response && question.required) {
                    pushError(question);
                }
                if (response && response.path && response.filename && question.type === "blob") {
                    response = yield this.s3Service.uploadFile(response.path, response.filename);
                }
                pushResponse(question, response);
                if (question.childQuestions) {
                    for (let j = 0; j < question.childQuestions.length; j++) {
                        const childQuestion = question.childQuestions[j];
                        const childBodyAnswer = fields[childQuestion.name];
                        const childFileAnswer = files[childQuestion.name];
                        const conditionMatches = typeof bodyAnswer !== "undefined" && childQuestion.conditionalValue === bodyAnswer;
                        let childResponse = typeof childBodyAnswer !== "undefined" ? childBodyAnswer : childFileAnswer;
                        if (!childResponse && childQuestion.required && conditionMatches) {
                            pushError(childQuestion);
                        }
                        if (childResponse && question.type === "blob") {
                            childResponse = yield this.s3Service.uploadFile(response.path, response.filename);
                        }
                        pushResponse(childQuestion, childResponse);
                    }
                }
            }
            const answerModel = yield this.answersService.create(answer);
            return { data: (0, answers_serializer_1.default)(answerModel) };
        });
    }
    getAreaAnswers(request, areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, template, query, userTeams } = request;
            let restricted = false;
            if (query && query.restricted === "true")
                restricted = true;
            const answers = yield this.answersService.filterAnswersByArea({
                reportId: template.id,
                teams: userTeams,
                areaId,
                loggedUser: user,
                restricted
            });
            if (!answers)
                throw new common_1.HttpException("no answers found with current permissions", common_1.HttpStatus.NOT_FOUND);
            return { data: (0, answers_serializer_1.default)(answers) };
        });
    }
    findAll(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, template } = request;
            return { data: (0, answers_serializer_1.default)(yield this.answersService.getAllTemplateAnswers({ user, template })) };
        });
    }
    findOne(id, request) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let filter = {};
            const { user, template, userTeams = [] } = request;
            let confirmedUsers = [];
            try {
                for (var userTeams_1 = __asyncValues(userTeams), userTeams_1_1; userTeams_1_1 = yield userTeams_1.next(), !userTeams_1_1.done;) {
                    const team = userTeams_1_1.value;
                    const users = yield this.teamMembersService.findAllTeamMembers(team.id, teamMember_schema_1.EMemberRole.Administrator);
                    confirmedUsers.push(...users.map(user => user.userId));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (userTeams_1_1 && !userTeams_1_1.done && (_a = userTeams_1.return)) yield _a.call(userTeams_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            confirmedUsers.push(user.id);
            if (user.role === "ADMIN" || user.id === template.user) {
                filter = {
                    _id: new mongoose_1.default.Types.ObjectId(id),
                    report: template.id
                };
            }
            else {
                filter = {
                    user: { $in: confirmedUsers },
                    _id: new mongoose_1.default.Types.ObjectId(id),
                    report: template.id
                };
            }
            const answer = yield this.answersService.findOne(filter);
            if (!answer)
                throw new common_1.HttpException('No answer found with your permissions', common_1.HttpStatus.NOT_FOUND);
            return { data: (0, answers_serializer_1.default)(yield this.answersService.addUsernameToAnswer(answer)) };
        });
    }
    update(id, updateAnswerDto) {
        return this.answersService.update(+id, updateAnswerDto);
    }
    remove(id, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, userTeams } = request;
            let permitted = false;
            const answer = yield this.answersService.findOne({ '_id': new mongoose_1.default.Types.ObjectId(id) });
            if (answer.user.toString() === user.id.toString())
                permitted = true;
            else {
                const areaTeams = yield this.teamAreaRelationService.find({ areaId: answer.areaOfInterest });
                const managerTeams = [];
                userTeams.forEach(userTeam => {
                    if (userTeam.userRole === "manager" || userTeam.userRole === "administrator")
                        managerTeams.push(userTeam.id.toString());
                });
                const managerArray = areaTeams.filter(areaTeamRelation => managerTeams.includes(areaTeamRelation.teamId.toString()));
                if (managerArray.length > 0)
                    permitted = true;
            }
            if (!permitted)
                throw new common_1.HttpException("You are not authorised to delete this record", 401);
            yield this.answersService.delete({ '_id': id });
        });
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)({ dest: './tmp' })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, create_answer_dto_1.CreateAnswerDto, Object]),
    __metadata("design:returntype", Promise)
], AnswersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('/area/:areaId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnswersController.prototype, "getAreaAnswers", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnswersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnswersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_answer_dto_1.UpdateAnswerDto]),
    __metadata("design:returntype", void 0)
], AnswersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnswersController.prototype, "remove", null);
AnswersController = __decorate([
    (0, common_1.Controller)('templates/:templateId/answers'),
    __metadata("design:paramtypes", [answers_service_1.AnswersService,
        teamMembers_service_1.TeamMembersService,
        teamAreaRelation_service_1.TeamAreaRelationService,
        s3Service_1.S3Service])
], AnswersController);
exports.AnswersController = AnswersController;
//# sourceMappingURL=answers.controller.js.map