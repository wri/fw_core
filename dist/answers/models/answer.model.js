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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerSchema = exports.Answer = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Answer = class Answer {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Answer.prototype, "report", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Answer.prototype, "reportName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Answer.prototype, "templateName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Answer.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Answer.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Answer.prototype, "teamId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Answer.prototype, "areaOfInterestName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Answer.prototype, "areaOfInterest", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Answer.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: [] }),
    __metadata("design:type", Array)
], Answer.prototype, "userPosition", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: [] }),
    __metadata("design:type", Array)
], Answer.prototype, "clickedPosition", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Answer.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], Answer.prototype, "responses", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now() }),
    __metadata("design:type", Date)
], Answer.prototype, "createdAt", void 0);
Answer = __decorate([
    (0, mongoose_1.Schema)()
], Answer);
exports.Answer = Answer;
exports.AnswerSchema = mongoose_1.SchemaFactory.createForClass(Answer);
//# sourceMappingURL=answer.model.js.map