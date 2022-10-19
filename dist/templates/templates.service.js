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
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const template_schema_1 = require("./models/template.schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
let TemplatesService = class TemplatesService {
    constructor(templateModel) {
        this.templateModel = templateModel;
    }
    create(createTemplateDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield new this.templateModel(createTemplateDto).save();
            return template;
        });
    }
    findAll() {
        return `This action returns all templates`;
    }
    find(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.templateModel.find(filter);
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.templateModel.findOne(filter);
        });
    }
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.templateModel.deleteMany(filter);
        });
    }
    getTemplate(id) {
        return `This action returns a #${id} template`;
    }
    update(id, updateTemplateDto) {
        return __awaiter(this, void 0, void 0, function* () {
            let template = yield this.templateModel.findById(id);
            if (updateTemplateDto.name)
                template.name = updateTemplateDto.name;
            if (updateTemplateDto.status)
                template.status = updateTemplateDto.status;
            if (updateTemplateDto.languages)
                template.languages = updateTemplateDto.languages;
            if (updateTemplateDto.public)
                template.public = updateTemplateDto.public;
            const savedTemplate = yield template.save();
            return savedTemplate;
        });
    }
    remove(id) {
        return `This action removes a #${id} template`;
    }
};
TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(template_schema_1.Template.name, 'formsDb')),
    __metadata("design:paramtypes", [mongoose_1.Model])
], TemplatesService);
exports.TemplatesService = TemplatesService;
//# sourceMappingURL=templates.service.js.map