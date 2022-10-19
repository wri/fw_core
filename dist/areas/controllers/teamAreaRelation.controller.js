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
var TeamAreaRelationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamAreaRelationController = void 0;
const common_1 = require("@nestjs/common");
const areas_service_1 = require("../services/areas.service");
const createTeamAreaRelation_dto_1 = require("../dto/createTeamAreaRelation.dto");
const teams_service_1 = require("../../teams/services/teams.service");
const teamAreaRelation_service_1 = require("../services/teamAreaRelation.service");
let TeamAreaRelationController = TeamAreaRelationController_1 = class TeamAreaRelationController {
    constructor(areasService, teamsService, teamAreaRelationService) {
        this.areasService = areasService;
        this.teamsService = teamsService;
        this.teamAreaRelationService = teamAreaRelationService;
        this.logger = new common_1.Logger(TeamAreaRelationController_1.name);
    }
    createTeamAreaRelation(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const area = yield this.areasService.getAreaMICROSERVICE(body.areaId);
            if (!area)
                throw new common_1.HttpException("Area doesn't exist", common_1.HttpStatus.NOT_FOUND);
            const team = yield this.teamsService.findById(body.teamId);
            if (!team)
                throw new common_1.HttpException("Team doesn't exist", common_1.HttpStatus.NOT_FOUND);
            return (yield this.teamAreaRelationService.create(body));
        });
    }
    deleteTeamAreaRelation(body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.teamAreaRelationService.delete(body);
        });
    }
    getAllTeamsForArea(areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const area = yield this.areasService.getAreaMICROSERVICE(areaId);
            if (!area)
                throw new common_1.HttpException("Area doesn't exist", common_1.HttpStatus.NOT_FOUND);
            const relations = yield this.teamAreaRelationService.find({ areaId });
            return relations.map(relation => relation.teamId);
        });
    }
    getAllAreasForTeam(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const team = yield this.teamsService.findById(teamId);
            if (!team)
                throw new common_1.HttpException("Team doesn't exist", common_1.HttpStatus.NOT_FOUND);
            const relations = yield this.teamAreaRelationService.find({ teamId });
            return relations.map(relation => relation.areaId);
        });
    }
    deleteOneRelation(teamId, areaId) {
        this.teamAreaRelationService.delete({ teamId, areaId });
    }
    deleteAllTeamRelations(teamId) {
        this.teamAreaRelationService.delete({ teamId });
    }
    deleteAllAreaRelations(areaId) {
        this.teamAreaRelationService.delete({ areaId });
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createTeamAreaRelation_dto_1.CreateTeamAreaRelationDto]),
    __metadata("design:returntype", Promise)
], TeamAreaRelationController.prototype, "createTeamAreaRelation", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createTeamAreaRelation_dto_1.CreateTeamAreaRelationDto]),
    __metadata("design:returntype", Promise)
], TeamAreaRelationController.prototype, "deleteTeamAreaRelation", null);
__decorate([
    (0, common_1.Get)('/areaTeams/:areaId'),
    __param(0, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamAreaRelationController.prototype, "getAllTeamsForArea", null);
__decorate([
    (0, common_1.Get)('/teamAreas/:teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamAreaRelationController.prototype, "getAllAreasForTeam", null);
__decorate([
    (0, common_1.Delete)('/deleteRelation/:teamId/:areaId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamAreaRelationController.prototype, "deleteOneRelation", null);
__decorate([
    (0, common_1.Delete)('/deleteAllForTeam/:teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamAreaRelationController.prototype, "deleteAllTeamRelations", null);
__decorate([
    (0, common_1.Delete)('/deleteAllForArea/:areaId'),
    __param(0, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamAreaRelationController.prototype, "deleteAllAreaRelations", null);
TeamAreaRelationController = TeamAreaRelationController_1 = __decorate([
    (0, common_1.Controller)('arearelations/teams'),
    __metadata("design:paramtypes", [areas_service_1.AreasService,
        teams_service_1.TeamsService,
        teamAreaRelation_service_1.TeamAreaRelationService])
], TeamAreaRelationController);
exports.TeamAreaRelationController = TeamAreaRelationController;
//# sourceMappingURL=teamAreaRelation.controller.js.map