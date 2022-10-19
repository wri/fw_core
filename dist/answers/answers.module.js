"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswersModule = void 0;
const common_1 = require("@nestjs/common");
const answers_service_1 = require("./services/answers.service");
const answers_controller_1 = require("./answers.controller");
const teamMembers_service_1 = require("../teams/services/teamMembers.service");
const user_service_1 = require("../common/user.service");
const mongoose_1 = require("@nestjs/mongoose");
const template_schema_1 = require("../templates/models/template.schema");
const answer_model_1 = require("./models/answer.model");
const team_schema_1 = require("../teams/models/team.schema");
const teamMember_schema_1 = require("../teams/models/teamMember.schema");
const templateAreaRelation_schema_1 = require("../areas/models/templateAreaRelation.schema");
const templates_service_1 = require("../templates/templates.service");
const templateAreaRelation_service_1 = require("../areas/services/templateAreaRelation.service");
const teams_service_1 = require("../teams/services/teams.service");
const templatePermissions_middleware_1 = require("./middleware/templatePermissions.middleware");
const s3Service_1 = require("./services/s3Service");
const teamAreaRelation_service_1 = require("../areas/services/teamAreaRelation.service");
const teamAreaRelation_schema_1 = require("../areas/models/teamAreaRelation.schema");
let AnswersModule = class AnswersModule {
    configure(consumer) {
        consumer
            .apply(templatePermissions_middleware_1.TemplatePermissionsMiddleware)
            .forRoutes('/templates/:templateId/answers', '/templates/:templateId/answers/:id');
    }
};
AnswersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: template_schema_1.Template.name, schema: template_schema_1.TemplateSchema }], 'formsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: answer_model_1.Answer.name, schema: answer_model_1.AnswerSchema }], 'formsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: team_schema_1.Team.name, schema: team_schema_1.TeamSchema }], 'teamsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: teamMember_schema_1.TeamMember.name, schema: teamMember_schema_1.TeamMemberSchema }], 'teamsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: templateAreaRelation_schema_1.TemplateAreaRelation.name, schema: templateAreaRelation_schema_1.TemplateAreaRelationSchema }], 'apiDb'),
            mongoose_1.MongooseModule.forFeature([{ name: teamAreaRelation_schema_1.TeamAreaRelation.name, schema: teamAreaRelation_schema_1.TeamAreaRelationSchema }], 'apiDb'),
        ],
        controllers: [answers_controller_1.AnswersController],
        providers: [
            templates_service_1.TemplatesService,
            templateAreaRelation_service_1.TemplateAreaRelationService,
            teamAreaRelation_service_1.TeamAreaRelationService,
            answers_service_1.AnswersService,
            teams_service_1.TeamsService,
            teamMembers_service_1.TeamMembersService,
            s3Service_1.S3Service,
            user_service_1.UserService
        ]
    })
], AnswersModule);
exports.AnswersModule = AnswersModule;
//# sourceMappingURL=answers.module.js.map