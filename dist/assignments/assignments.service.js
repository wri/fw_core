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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const assignment_schema_1 = require("./models/assignment.schema");
const mongoose_2 = require("mongoose");
const teams_service_1 = require("../teams/services/teams.service");
const mongoose_3 = __importDefault(require("mongoose"));
const allowedKeys = [
    'name',
    'priority',
    'monitors',
    'notes',
    'status',
    'areaId',
    'templateId',
    'teamIds'
];
let AssignmentsService = class AssignmentsService {
    constructor(assignmentModel, teamsService) {
        this.assignmentModel = assignmentModel;
        this.teamsService = teamsService;
    }
    create(assignment) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignmentToSave = new this.assignmentModel(assignment);
            return yield assignmentToSave.save();
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.assignmentModel.findOne(filter);
        });
    }
    findUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.assignmentModel.find({ monitors: userId });
        });
    }
    findTeams(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const teams = yield this.teamsService.findAllByUserId(userId);
            const teamIds = teams.map(team => team.id);
            return yield this.assignmentModel.find({ teamIds: { $in: teamIds } });
        });
    }
    findAreas(userId, areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const teams = yield this.teamsService.findAllByUserId(userId);
            const teamIds = teams.map(team => team.id);
            return yield this.assignmentModel.find({ teamIds: { $in: teamIds }, areaId });
        });
    }
    update(id, updateAssignmentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            let assignmentToUpdate = yield this.assignmentModel.findOne({ _id: new mongoose_3.default.Types.ObjectId(id) });
            for (const [key, value] of Object.entries(updateAssignmentDto)) {
                if (!allowedKeys.includes(key))
                    continue;
                assignmentToUpdate[key] = value;
            }
            const updatedAssignment = yield assignmentToUpdate.save();
            return updatedAssignment;
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assignmentModel.findOneAndDelete({ _id: new mongoose_3.default.Types.ObjectId(id) });
            return null;
        });
    }
};
AssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(assignment_schema_1.Assignment.name, 'formsDb')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        teams_service_1.TeamsService])
], AssignmentsService);
exports.AssignmentsService = AssignmentsService;
//# sourceMappingURL=assignments.service.js.map