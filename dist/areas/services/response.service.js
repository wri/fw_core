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
exports.ResponseService = void 0;
const common_1 = require("@nestjs/common");
const geostore_service_1 = require("./geostore.service");
const config = require("config");
const coverage_service_1 = require("./coverage.service");
const dataset_service_1 = require("./dataset.service");
const templateAreaRelation_service_1 = require("./templateAreaRelation.service");
const templates_service_1 = require("../../templates/templates.service");
const teams_service_1 = require("../../teams/services/teams.service");
const teamAreaRelation_service_1 = require("./teamAreaRelation.service");
const ALERTS_SUPPORTED = config.get("alertsSupported");
let ResponseService = class ResponseService {
    constructor(geostoreService, coverageService, datasetService, templateAreaRelationService, teamAreaRelationService, templatesService, teamsService) {
        this.geostoreService = geostoreService;
        this.coverageService = coverageService;
        this.datasetService = datasetService;
        this.templateAreaRelationService = templateAreaRelationService;
        this.teamAreaRelationService = teamAreaRelationService;
        this.templatesService = templatesService;
        this.teamsService = teamsService;
    }
    buildAreasResponse(areas, objects, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { geostoreObj, coverageObj } = objects;
            const areasWithGeostore = areas.filter(area => area.attributes.geostore);
            const promises = [];
            if (!geostoreObj) {
                promises.push(Promise.all(areasWithGeostore.map(area => this.geostoreService.getGeostore(area.attributes.geostore, user.token))));
            }
            if (!coverageObj) {
                promises.push(Promise.all(areasWithGeostore.map(area => {
                    const params = {
                        geostoreId: area.attributes.geostore,
                        slugs: ALERTS_SUPPORTED
                    };
                    return this.coverageService.getCoverage(params, user.token);
                })));
            }
            promises.push(Promise.all(areasWithGeostore.map((area) => __awaiter(this, void 0, void 0, function* () {
                const templateIds = yield this.templateAreaRelationService.find({ areaId: area.id });
                return this.templatesService.find({ '_id': { $in: templateIds.map(templateId => templateId.templateId) } });
            }))));
            const userTeams = yield this.teamsService.findAllByUserId(user.id);
            promises.push(Promise.all(areasWithGeostore.map((area) => __awaiter(this, void 0, void 0, function* () {
                const areaTeams = yield this.teamAreaRelationService.getAllTeamsForArea(area.id);
                const filteredTeams = userTeams.filter(userTeam => areaTeams.includes(userTeam.id));
                return filteredTeams.map(filteredTeam => {
                    return { id: filteredTeam.id, name: filteredTeam.name };
                });
            }))));
            try {
                const [geostoreData, coverageData, templateData, teamData] = yield Promise.all(promises);
                return areasWithGeostore.map((area, index) => {
                    let geostore, coverage;
                    if (geostoreObj)
                        geostore = geostoreObj;
                    else if (geostoreData && geostoreData[index])
                        geostore = geostoreData[index];
                    else
                        geostore = {};
                    if (coverageObj)
                        coverage = coverageObj.layers;
                    else if (coverageData && coverageData[index])
                        coverage = coverageData[index].layers;
                    else
                        coverage = [];
                    const datasets = this.datasetService.getDatasetsWithCoverage(area.attributes.datasets, coverage);
                    return Object.assign(Object.assign({}, area), { attributes: Object.assign(Object.assign({}, area.attributes), { geostore,
                            datasets,
                            coverage, reportTemplate: templateData[index], teams: teamData[index] }) });
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
};
ResponseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [geostore_service_1.GeostoreService,
        coverage_service_1.CoverageService,
        dataset_service_1.DatasetService,
        templateAreaRelation_service_1.TemplateAreaRelationService,
        teamAreaRelation_service_1.TeamAreaRelationService,
        templates_service_1.TemplatesService,
        teams_service_1.TeamsService])
], ResponseService);
exports.ResponseService = ResponseService;
//# sourceMappingURL=response.service.js.map