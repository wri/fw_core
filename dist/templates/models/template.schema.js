"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateSchema = exports.TemplateQuestionSchema = exports.Template = exports.TemplateQuestion = exports.ETemplateStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose = __importStar(require("mongoose"));
var ETemplateStatus;
(function (ETemplateStatus) {
    ETemplateStatus["PUBLISHED"] = "published";
    ETemplateStatus["UNPUBLISHED"] = "unpublished";
})(ETemplateStatus = exports.ETemplateStatus || (exports.ETemplateStatus = {}));
let TemplateQuestion = class TemplateQuestion {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TemplateQuestion.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: {} }),
    __metadata("design:type", mongoose.Schema.Types.Mixed)
], TemplateQuestion.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TemplateQuestion.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", mongoose.Schema.Types.Mixed)
], TemplateQuestion.prototype, "defaultValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: {} }),
    __metadata("design:type", mongoose.Schema.Types.Mixed)
], TemplateQuestion.prototype, "values", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], TemplateQuestion.prototype, "required", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], TemplateQuestion.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], TemplateQuestion.prototype, "childQuestions", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], TemplateQuestion.prototype, "conditions", void 0);
TemplateQuestion = __decorate([
    (0, mongoose_1.Schema)()
], TemplateQuestion);
exports.TemplateQuestion = TemplateQuestion;
let Template = class Template {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: {} }),
    __metadata("design:type", mongoose.Schema.Types.Mixed)
], Template.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Template.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Array)
], Template.prototype, "languages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Template.prototype, "defaultLanguage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], Template.prototype, "public", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, default: "unpublished" }),
    __metadata("design:type", String)
], Template.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Array)
], Template.prototype, "questions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", String)
], Template.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Template.prototype, "answersCount", void 0);
Template = __decorate([
    (0, mongoose_1.Schema)()
], Template);
exports.Template = Template;
exports.TemplateQuestionSchema = mongoose_1.SchemaFactory.createForClass(TemplateQuestion);
exports.TemplateSchema = mongoose_1.SchemaFactory.createForClass(Template);
//# sourceMappingURL=template.schema.js.map