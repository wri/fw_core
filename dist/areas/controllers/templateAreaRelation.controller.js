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
var TemplateAreaRelationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateAreaRelationController = void 0;
const common_1 = require("@nestjs/common");
const areas_service_1 = require("../services/areas.service");
const createTemplateAreaRelation_dto_1 = require("../dto/createTemplateAreaRelation.dto");
const templates_service_1 = require("../../templates/templates.service");
const templateAreaRelation_service_1 = require("../services/templateAreaRelation.service");
let TemplateAreaRelationController = TemplateAreaRelationController_1 = class TemplateAreaRelationController {
    constructor(areasService, templatesService, templateAreaRelationService) {
        this.areasService = areasService;
        this.templatesService = templatesService;
        this.templateAreaRelationService = templateAreaRelationService;
        this.logger = new common_1.Logger(TemplateAreaRelationController_1.name);
    }
    createTemplateAreaRelation(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const area = yield this.areasService.getAreaMICROSERVICE(body.areaId);
            if (!area)
                throw new common_1.HttpException("Area doesn't exist", common_1.HttpStatus.NOT_FOUND);
            const template = yield this.templatesService.getTemplate(body.templateId);
            if (!template)
                throw new common_1.HttpException("Template doesn't exist", common_1.HttpStatus.NOT_FOUND);
            return (yield this.templateAreaRelationService.create(body));
        });
    }
    deleteTemplateAreaRelation(body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.templateAreaRelationService.delete(body);
        });
    }
    getAllTemplatesForArea(areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const area = yield this.areasService.getAreaMICROSERVICE(areaId);
            if (!area)
                throw new common_1.HttpException("Area doesn't exist", common_1.HttpStatus.NOT_FOUND);
            const relations = yield this.templateAreaRelationService.find({ areaId });
            return relations.map(relation => relation.templateId);
        });
    }
    deleteAllTemplateRelations(templateId) {
        this.templateAreaRelationService.delete({ templateId });
    }
    deleteAllAreaRelations(areaId) {
        this.templateAreaRelationService.delete({ areaId });
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createTemplateAreaRelation_dto_1.CreateTemplateAreaRelationDto]),
    __metadata("design:returntype", Promise)
], TemplateAreaRelationController.prototype, "createTemplateAreaRelation", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createTemplateAreaRelation_dto_1.CreateTemplateAreaRelationDto]),
    __metadata("design:returntype", Promise)
], TemplateAreaRelationController.prototype, "deleteTemplateAreaRelation", null);
__decorate([
    (0, common_1.Get)('/areaTemplates/:areaId'),
    __param(0, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TemplateAreaRelationController.prototype, "getAllTemplatesForArea", null);
__decorate([
    (0, common_1.Delete)('/deleteAllForTemplate/:templateId'),
    __param(0, (0, common_1.Param)('templateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplateAreaRelationController.prototype, "deleteAllTemplateRelations", null);
__decorate([
    (0, common_1.Delete)('/deleteAllForArea/:areaId'),
    __param(0, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplateAreaRelationController.prototype, "deleteAllAreaRelations", null);
TemplateAreaRelationController = TemplateAreaRelationController_1 = __decorate([
    (0, common_1.Controller)('arearelations/templates'),
    __metadata("design:paramtypes", [areas_service_1.AreasService,
        templates_service_1.TemplatesService,
        templateAreaRelation_service_1.TemplateAreaRelationService])
], TemplateAreaRelationController);
exports.TemplateAreaRelationController = TemplateAreaRelationController;
//# sourceMappingURL=templateAreaRelation.controller.js.map