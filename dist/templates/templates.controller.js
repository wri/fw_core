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
var TemplatesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesController = void 0;
const common_1 = require("@nestjs/common");
const templates_service_1 = require("./templates.service");
const update_template_dto_1 = require("./dto/update-template.dto");
const answers_service_1 = require("../answers/services/answers.service");
const template_serializer_1 = __importDefault(require("./serializers/template.serializer"));
const template_schema_1 = require("./models/template.schema");
const teams_service_1 = require("../teams/services/teams.service");
const answers_serializer_1 = __importDefault(require("../answers/serializers/answers.serializer"));
const templateAreaRelation_service_1 = require("../areas/services/templateAreaRelation.service");
const mongoose_1 = __importDefault(require("mongoose"));
let TemplatesController = TemplatesController_1 = class TemplatesController {
    constructor(templatesService, answersService, teamsService, templateAreaRelationService) {
        this.templatesService = templatesService;
        this.answersService = answersService;
        this.teamsService = teamsService;
        this.templateAreaRelationService = templateAreaRelationService;
        this.logger = new common_1.Logger(TemplatesController_1.name);
    }
    create(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body, user } = request;
            if (body.public && user.role !== "ADMIN")
                throw new common_1.HttpException("You must be an administrator to create a public template", common_1.HttpStatus.FORBIDDEN);
            const template = {
                name: body.name,
                user: user.id,
                languages: body.languages,
                defaultLanguage: body.defaultLanguage,
                questions: body.questions,
                public: body.public,
                status: body.status
            };
            const savedTemplate = yield this.templatesService.create(template);
            return { data: (0, template_serializer_1.default)(savedTemplate) };
        });
    }
    findAll(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const filter = {
                $and: [
                    {
                        $or: [{ $and: [{ public: true }, { status: "published" }] }, { user: user.id }]
                    }
                ]
            };
            this.logger.log("Obtaining all user templates");
            const templates = yield this.templatesService.find(filter);
            const numReports = templates.length;
            for (let i = 1; i < numReports; i++) {
                let answersFilter = {};
                if (user.role === "ADMIN" || user.id === templates[i].user) {
                    answersFilter = {
                        report: templates[i].id
                    };
                }
                else {
                    answersFilter = {
                        user: user.id,
                        report: templates[i].id
                    };
                }
                const answers = yield this.answersService.findSome(answersFilter);
                templates[i].answersCount = answers.length || 0;
            }
            return { data: (0, template_serializer_1.default)(templates) };
        });
    }
    getAllAnswersForUser(request) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Obtaining all answers for user`);
            const { user } = request;
            const userTeams = yield this.teamsService.findAllByUserId(user.id);
            const answers = yield this.answersService.getAllAnswers({
                loggedUser: user,
                teams: userTeams
            });
            try {
                for (var answers_1 = __asyncValues(answers), answers_1_1; answers_1_1 = yield answers_1.next(), !answers_1_1.done;) {
                    const answer = answers_1_1.value;
                    const template = yield this.templatesService.findOne({ _id: answer.report });
                    answer.templateName = template.name[answer.language];
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (answers_1_1 && !answers_1_1.done && (_a = answers_1.return)) yield _a.call(answers_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (!answers) {
                throw new common_1.HttpException("Answers not found for this user", common_1.HttpStatus.NOT_FOUND);
            }
            else
                return { data: (0, answers_serializer_1.default)(answers) };
        });
    }
    findOne(id, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            this.logger.log("Obtaining template", id);
            let template = yield this.templatesService.findOne({ id });
            let answersFilter = {};
            if (user.role === "ADMIN" || user.id === template.user) {
                answersFilter = {
                    report: template.id
                };
            }
            else {
                answersFilter = {
                    user: user.id,
                    report: template.id
                };
            }
            const answers = yield this.answersService.findSome(answersFilter);
            template.answersCount = answers.length;
            return { data: (0, template_serializer_1.default)(template) };
        });
    }
    update(id, body, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const filter = {
                $and: [{ '_id': new mongoose_1.default.Types.ObjectId(id) }]
            };
            if (user.role !== "ADMIN") {
                filter.$and.push({ 'user': new mongoose_1.default.Types.ObjectId(user.id) });
            }
            const templateToUpdate = yield this.templatesService.findOne(filter);
            if (!templateToUpdate)
                throw new common_1.HttpException("You do not have permission to edit this template", common_1.HttpStatus.FORBIDDEN);
            if (user.role !== 'ADMIN' && body.hasOwnProperty('public'))
                delete body.public;
            const template = yield this.templatesService.update(id, body);
            let answersFilter = {};
            if (user.role === "ADMIN" || user.id === template.user) {
                answersFilter = {
                    report: template.id
                };
            }
            else {
                answersFilter = {
                    user: user.id,
                    report: template.id
                };
            }
            const answers = yield this.answersService.findSome(answersFilter);
            template.answersCount = answers.length;
            return { data: (0, template_serializer_1.default)(template) };
        });
    }
    deleteAllAnswers(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            yield this.answersService.delete({ user: user.id });
        });
    }
    remove(id, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const answers = yield this.answersService.findSome({ report: id });
            if (answers.length > 0 && user.role !== "ADMIN") {
                throw new common_1.HttpException("This report has answers, you cannot delete. Please unpublish instead.", common_1.HttpStatus.FORBIDDEN);
            }
            const template = yield this.templatesService.findOne({ '_id': new mongoose_1.default.Types.ObjectId(id) });
            if (template.status === template_schema_1.ETemplateStatus.PUBLISHED && user.role !== "ADMIN") {
                throw new common_1.HttpException("You cannot delete a published template. Please unpublish first.", common_1.HttpStatus.FORBIDDEN);
            }
            const query = {
                $and: [{ '_id': new mongoose_1.default.Types.ObjectId(id) }]
            };
            if (user.role !== "ADMIN") {
                query.$and.push({ 'user': user.id });
                query.$and.push({ status: ["draft", "unpublished"] });
            }
            else if (answers.length > 0) {
                yield this.answersService.delete({ report: id });
            }
            const result = yield this.templatesService.delete(query);
            yield this.templateAreaRelationService.delete({ templateId: id });
        });
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('/getAllAnswersForUser'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "getAllAnswersForUser", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_template_dto_1.UpdateTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('/deleteAllAnswers'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "deleteAllAnswers", null);
__decorate([
    (0, common_1.Delete)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "remove", null);
TemplatesController = TemplatesController_1 = __decorate([
    (0, common_1.Controller)('templates'),
    __metadata("design:paramtypes", [templates_service_1.TemplatesService,
        answers_service_1.AnswersService,
        teams_service_1.TeamsService,
        templateAreaRelation_service_1.TemplateAreaRelationService])
], TemplatesController);
exports.TemplatesController = TemplatesController;
//# sourceMappingURL=templates.controller.js.map