"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreasModule = void 0;
const common_1 = require("@nestjs/common");
const areas_service_1 = require("../services/areas.service");
const areas_controller_1 = require("../controllers/areas.controller");
const user_service_1 = require("../../common/user.service");
const geostore_service_1 = require("../services/geostore.service");
const dataset_service_1 = require("../services/dataset.service");
const coverage_service_1 = require("../services/coverage.service");
const teams_service_1 = require("../../teams/services/teams.service");
const teamAreaRelation_service_1 = require("../services/teamAreaRelation.service");
const team_schema_1 = require("../../teams/models/team.schema");
const mongoose_1 = require("@nestjs/mongoose");
const teamMembers_service_1 = require("../../teams/services/teamMembers.service");
const teamMember_schema_1 = require("../../teams/models/teamMember.schema");
const teamAreaRelation_schema_1 = require("../models/teamAreaRelation.schema");
const templateAreaRelation_service_1 = require("../services/templateAreaRelation.service");
const templateAreaRelation_schema_1 = require("../models/templateAreaRelation.schema");
const response_service_1 = require("../services/response.service");
const templates_service_1 = require("../../templates/templates.service");
const template_schema_1 = require("../../templates/models/template.schema");
const teamAreaRelation_controller_1 = require("../controllers/teamAreaRelation.controller");
const templateAreaRelation_controller_1 = require("../controllers/templateAreaRelation.controller");
let AreasModule = class AreasModule {
};
AreasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: team_schema_1.Team.name, schema: team_schema_1.TeamSchema }], 'teamsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: teamMember_schema_1.TeamMember.name, schema: teamMember_schema_1.TeamMemberSchema }], 'teamsDb'),
            mongoose_1.MongooseModule.forFeature([{ name: teamAreaRelation_schema_1.TeamAreaRelation.name, schema: teamAreaRelation_schema_1.TeamAreaRelationSchema }], 'apiDb'),
            mongoose_1.MongooseModule.forFeature([{ name: templateAreaRelation_schema_1.TemplateAreaRelation.name, schema: templateAreaRelation_schema_1.TemplateAreaRelationSchema }], 'apiDb'),
            mongoose_1.MongooseModule.forFeature([{ name: template_schema_1.Template.name, schema: template_schema_1.TemplateSchema }], 'formsDb'),
        ],
        controllers: [areas_controller_1.AreasController, teamAreaRelation_controller_1.TeamAreaRelationController, templateAreaRelation_controller_1.TemplateAreaRelationController],
        providers: [
            areas_service_1.AreasService,
            user_service_1.UserService,
            geostore_service_1.GeostoreService,
            dataset_service_1.DatasetService,
            coverage_service_1.CoverageService,
            teams_service_1.TeamsService,
            teamMembers_service_1.TeamMembersService,
            teamAreaRelation_service_1.TeamAreaRelationService,
            templateAreaRelation_service_1.TemplateAreaRelationService,
            user_service_1.UserService,
            response_service_1.ResponseService,
            templates_service_1.TemplatesService
        ]
    })
], AreasModule);
exports.AreasModule = AreasModule;
//# sourceMappingURL=areas.module.js.map