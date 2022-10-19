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
var AreasController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreasController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const areas_service_1 = require("../services/areas.service");
const create_area_dto_1 = require("../dto/create-area.dto");
const update_area_dto_1 = require("../dto/update-area.dto");
const teams_service_1 = require("../../teams/services/teams.service");
const teamAreaRelation_service_1 = require("../services/teamAreaRelation.service");
const templateAreaRelation_service_1 = require("../services/templateAreaRelation.service");
const response_service_1 = require("../services/response.service");
const templates_service_1 = require("../../templates/templates.service");
let AreasController = AreasController_1 = class AreasController {
    constructor(areasService, responseService, teamsService, templatesService, teamAreaRelationService, templateAreaRelationService) {
        this.areasService = areasService;
        this.responseService = responseService;
        this.teamsService = teamsService;
        this.templatesService = templatesService;
        this.teamAreaRelationService = teamAreaRelationService;
        this.templateAreaRelationService = templateAreaRelationService;
        this.logger = new common_1.Logger(AreasController_1.name);
    }
    getUserAreas(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            let data;
            if (user && user.id) {
                try {
                    const areas = yield this.areasService.getUserAreas(user);
                    areas.forEach(area => {
                        if (area.attributes.userId !== user.id)
                            throw new common_1.HttpException('Incorrect areas found', common_1.HttpStatus.SERVICE_UNAVAILABLE);
                    });
                    try {
                        data = yield this.responseService.buildAreasResponse(areas, {}, user);
                    }
                    catch (error) {
                        this.logger.error("Error while retrieving area's geostore, template, and coverage", error);
                        throw new common_1.HttpException("Error while retrieving area's geostore, template, and coverage", error.status);
                    }
                }
                catch (error) {
                    this.logger.error("Error while retrieving areas", error);
                    throw new common_1.HttpException("Error while retrieving areas", error.status);
                }
            }
            return { data };
        });
    }
    getUserAndTeamAreas(request) {
        var e_1, _a, e_2, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            let data;
            if (user && user.id) {
                try {
                    const userAreas = yield this.areasService.getUserAreas(user);
                    userAreas.forEach(area => {
                        if (area.attributes.userId !== user.id)
                            throw new common_1.HttpException('Incorrect areas found', common_1.HttpStatus.SERVICE_UNAVAILABLE);
                        area.attributes.teamId = null;
                    });
                    const userTeams = yield this.teamsService.findAllByUserId(user.id);
                    try {
                        for (var userTeams_1 = __asyncValues(userTeams), userTeams_1_1; userTeams_1_1 = yield userTeams_1.next(), !userTeams_1_1.done;) {
                            const team = userTeams_1_1.value;
                            let teamAreas = yield this.teamAreaRelationService.getAllAreasForTeam(team.id);
                            let fullTeamAreas = [];
                            try {
                                for (var teamAreas_1 = (e_2 = void 0, __asyncValues(teamAreas)), teamAreas_1_1; teamAreas_1_1 = yield teamAreas_1.next(), !teamAreas_1_1.done;) {
                                    const teamAreaId = teamAreas_1_1.value;
                                    let area = this.areasService.getAreaMICROSERVICE(teamAreaId);
                                    fullTeamAreas.push(area);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (teamAreas_1_1 && !teamAreas_1_1.done && (_b = teamAreas_1.return)) yield _b.call(teamAreas_1);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                            let resolvedTeamAreas = yield Promise.all(fullTeamAreas);
                            resolvedTeamAreas.forEach(area => area.attributes.teamId = team.id);
                            userAreas.push(...resolvedTeamAreas);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (userTeams_1_1 && !userTeams_1_1.done && (_a = userTeams_1.return)) yield _a.call(userTeams_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    data = yield this.responseService.buildAreasResponse(userAreas, {}, user);
                }
                catch (error) {
                    throw new common_1.HttpException('Failed to get user and team areas', error.status);
                }
            }
            return { data };
        });
    }
    createArea(image, request, body) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!body.name)
                throw new common_1.HttpException("Request must contain a name", common_1.HttpStatus.BAD_REQUEST);
            if (!body.geojson)
                throw new common_1.HttpException("Request must contain a geojson", common_1.HttpStatus.BAD_REQUEST);
            if (!image)
                throw new common_1.HttpException("Request must contain an image", common_1.HttpStatus.BAD_REQUEST);
            const { user } = request;
            const { geojson, name } = body;
            let data;
            if (user && user.id) {
                try {
                    const { area, geostore, coverage } = yield this.areasService.createAreaWithGeostore({ name, image }, JSON.parse(geojson), user);
                    this.logger.log(`Created area with id ${area.id}`);
                    try {
                        [data] = yield this.responseService.buildAreasResponse([area], { geostoreObj: geostore, coverageObj: coverage }, user);
                    }
                    catch (error) {
                        this.logger.error("Error while building area response", error);
                    }
                }
                catch (error) {
                    this.logger.error("Error while creating area", error);
                }
            }
            return { data };
        });
    }
    findOneArea(request, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let area;
            const { user } = request;
            const userTeams = yield this.teamsService.findAllByUserId(user.id);
            const areaTeams = yield this.teamAreaRelationService.getAllTeamsForArea(id);
            const filteredTeams = userTeams.filter(userTeam => areaTeams.includes(userTeam.id));
            if (filteredTeams.length > 0)
                area = yield this.areasService.getAreaMICROSERVICE(id);
            else
                area = yield this.areasService.getArea(id, user);
            const [data] = yield this.responseService.buildAreasResponse([area], {}, user);
            return { data };
        });
    }
    updateArea(image, id, request, updateAreaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            let existingArea = yield this.areasService.getArea(id, user);
            if (!existingArea)
                throw new common_1.HttpException("Area not found", common_1.HttpStatus.NOT_FOUND);
            if (!updateAreaDto.name)
                throw new common_1.HttpException("Request must contain a name", common_1.HttpStatus.BAD_REQUEST);
            if (!updateAreaDto.geojson)
                throw new common_1.HttpException("Request must contain a geojson", common_1.HttpStatus.BAD_REQUEST);
            if (!image)
                throw new common_1.HttpException("Request must contain an image", common_1.HttpStatus.BAD_REQUEST);
            const { geojson, name } = updateAreaDto;
            let data = null;
            if (user && user.id) {
                try {
                    const { area, geostoreId, coverage } = yield this.areasService.updateAreaWithGeostore({
                        name,
                        image
                    }, geojson ? JSON.parse(geojson) : null, existingArea, user);
                    try {
                        [data] = yield this.responseService.buildAreasResponse([area], {
                            coverage
                        }, user);
                    }
                    catch (e) {
                        this.logger.error(e);
                        throw new common_1.HttpException("Error while building area response", e.status);
                    }
                }
                catch (e) {
                    this.logger.error(e);
                    throw new common_1.HttpException("Error while updating area", e.status);
                }
            }
            return { data };
        });
    }
    deleteOneArea(id, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const area = yield this.areasService.getArea(id, user);
            if (area.attributes.userId.toString() !== user.id.toString())
                throw new common_1.HttpException("You are not authorised to delete this record", common_1.HttpStatus.UNAUTHORIZED);
            const deletedArea = yield this.areasService.delete(id, user);
            yield this.teamAreaRelationService.delete({ areaId: id });
            yield this.templateAreaRelationService.delete({ areaId: id });
            return deletedArea.id;
        });
    }
};
__decorate([
    (0, common_1.Get)('/user'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "getUserAreas", null);
__decorate([
    (0, common_1.Get)('/userAndTeam'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "getUserAndTeamAreas", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { dest: './tmp' })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, create_area_dto_1.CreateAreaDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "createArea", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "findOneArea", null);
__decorate([
    (0, common_1.Patch)('/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { dest: './tmp' })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, update_area_dto_1.UpdateAreaDto]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "updateArea", null);
__decorate([
    (0, common_1.Delete)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AreasController.prototype, "deleteOneArea", null);
AreasController = AreasController_1 = __decorate([
    (0, common_1.Controller)('areas'),
    __metadata("design:paramtypes", [areas_service_1.AreasService,
        response_service_1.ResponseService,
        teams_service_1.TeamsService,
        templates_service_1.TemplatesService,
        teamAreaRelation_service_1.TeamAreaRelationService,
        templateAreaRelation_service_1.TemplateAreaRelationService])
], AreasController);
exports.AreasController = AreasController;
//# sourceMappingURL=areas.controller.js.map