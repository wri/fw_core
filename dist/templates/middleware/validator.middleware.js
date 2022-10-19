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
exports.CreateTemplateMiddleware = void 0;
const common_1 = require("@nestjs/common");
let CreateTemplateMiddleware = class CreateTemplateMiddleware {
    constructor() { }
    use(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body } = req;
            const errors = [];
            if (!body.name)
                throw new common_1.HttpException("Request body is missing field 'name'", common_1.HttpStatus.BAD_REQUEST);
            if (!body.questions)
                throw new common_1.HttpException("Request body is missing field 'questions'", common_1.HttpStatus.BAD_REQUEST);
            if (!body.languages)
                throw new common_1.HttpException("Request body is missing field 'languages'", common_1.HttpStatus.BAD_REQUEST);
            if (!body.defaultLanguage)
                throw new common_1.HttpException("Request body is missing field 'defaultLanguage'", common_1.HttpStatus.BAD_REQUEST);
            if (!body.status)
                throw new common_1.HttpException("Request body is missing field 'status'", common_1.HttpStatus.BAD_REQUEST);
            if (!["published", "unpublished"].includes(body.status))
                throw new common_1.HttpException("Status must be published or unpublished", common_1.HttpStatus.BAD_REQUEST);
            const pushError = (source, detail) => {
                errors.push({
                    [source]: detail
                });
            };
            const checkQuestion = question => {
                body.languages.forEach(lang => {
                    if (!question.label[lang]) {
                        pushError("name", `Question ${question.name}: label does not match language options`);
                    }
                    if (question.type === "text" && question.defaultValue) {
                        if (!question.defaultValue[lang]) {
                            pushError("name", `Question ${question.name}: defaultValue does not match language options`);
                        }
                    }
                    if (question.type === "select" || question.type === "radio" || question.type === "checkbox") {
                        if (!question.values[lang]) {
                            pushError("name", `Question ${question.name}: values do not match language options`);
                        }
                    }
                });
            };
            if (body.languages.length > 1) {
                if (!body.defaultLanguage || body.languages.indexOf(body.defaultLanguage) === -1) {
                    pushError("languages", `Languages: values do not match language options`);
                }
            }
            body.languages.forEach(lang => {
                if (body.name[lang] === undefined) {
                    pushError("Report name", "values do not match language options");
                }
            });
            body.questions.forEach(question => {
                checkQuestion(question);
                if (question.childQuestions) {
                    question.childQuestions.forEach(childQuestion => {
                        checkQuestion(childQuestion);
                    });
                }
            });
            if (errors.length > 0)
                throw new common_1.HttpException(errors, common_1.HttpStatus.BAD_REQUEST);
            yield next();
        });
    }
};
CreateTemplateMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CreateTemplateMiddleware);
exports.CreateTemplateMiddleware = CreateTemplateMiddleware;
;
//# sourceMappingURL=validator.middleware.js.map