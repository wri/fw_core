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
exports.TeamAreaRelationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const teamAreaRelation_schema_1 = require("../models/teamAreaRelation.schema");
let TeamAreaRelationService = class TeamAreaRelationService {
    constructor(teamAreaRelationModel) {
        this.teamAreaRelationModel = teamAreaRelationModel;
    }
    create({ areaId, teamId }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.teamAreaRelationModel.findOne({ areaId, teamId }))
                throw new common_1.HttpException("Relation already exists", common_1.HttpStatus.BAD_REQUEST);
            const newRelation = new this.teamAreaRelationModel({ areaId, teamId });
            return yield newRelation.save();
        });
    }
    getAllTeamsForArea(areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = yield this.teamAreaRelationModel.find({ areaId });
            return relations.map(relation => relation.teamId);
        });
    }
    getAllAreasForTeam(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = yield this.teamAreaRelationModel.find({ teamId });
            return relations.map(relation => relation.areaId);
        });
    }
    find(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.teamAreaRelationModel.find(filter);
        });
    }
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.teamAreaRelationModel.deleteMany(filter);
        });
    }
};
TeamAreaRelationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(teamAreaRelation_schema_1.TeamAreaRelation.name, 'apiDb')),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TeamAreaRelationService);
exports.TeamAreaRelationService = TeamAreaRelationService;
//# sourceMappingURL=teamAreaRelation.service.js.map