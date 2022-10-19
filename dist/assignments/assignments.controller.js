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
exports.AssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const assignments_service_1 = require("./assignments.service");
const create_assignment_dto_1 = require("./dto/create-assignment.dto");
const update_assignment_dto_1 = require("./dto/update-assignment.dto");
const mongoose_1 = __importDefault(require("mongoose"));
const assignments_serializer_1 = __importDefault(require("./serializers/assignments.serializer"));
let AssignmentsController = class AssignmentsController {
    constructor(assignmentsService) {
        this.assignmentsService = assignmentsService;
    }
    create(request, createAssignmentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const createdAssignment = yield this.assignmentsService.create(Object.assign(Object.assign({}, createAssignmentDto), { createdBy: request.user.id }));
            return { data: (0, assignments_serializer_1.default)(createdAssignment) };
        });
    }
    findUserAssignments(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const assignments = yield this.assignmentsService.findUser(user.id);
            return { data: (0, assignments_serializer_1.default)(assignments) };
        });
    }
    findTeamAssignments(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const assignments = yield this.assignmentsService.findTeams(user.id);
            return { data: (0, assignments_serializer_1.default)(assignments) };
        });
    }
    findAreaAssignments(request, areaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = request;
            const assignments = yield this.assignmentsService.findAreas(user.id, areaId);
            return { data: (0, assignments_serializer_1.default)(assignments) };
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const assignment = yield this.assignmentsService.findOne({ _id: new mongoose_1.default.Types.ObjectId(id) });
            return { data: (0, assignments_serializer_1.default)(assignment) };
        });
    }
    update(request, id, updateAssignmentDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = {
                createdBy: request.user.id,
                status: "incomplete",
                _id: new mongoose_1.default.Types.ObjectId(id)
            };
            const assignment = yield this.assignmentsService.findOne(filter);
            if (!assignment)
                throw new common_1.HttpException('You do not have access to edit this resource', common_1.HttpStatus.FORBIDDEN);
            const updatedAssignment = yield this.assignmentsService.update(id, updateAssignmentDto);
            return { data: (0, assignments_serializer_1.default)(updatedAssignment) };
        });
    }
    remove(request, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = {
                createdBy: request.user.id,
                _id: new mongoose_1.default.Types.ObjectId(id)
            };
            const assignment = yield this.assignmentsService.findOne(filter);
            if (!assignment)
                throw new common_1.HttpException('You do not have access to delete this resource', common_1.HttpStatus.FORBIDDEN);
            return yield this.assignmentsService.remove(id);
        });
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_assignment_dto_1.CreateAssignmentDto]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('/user'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findUserAssignments", null);
__decorate([
    (0, common_1.Get)('/teams'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findTeamAssignments", null);
__decorate([
    (0, common_1.Get)('/areas/:areaId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findAreaAssignments", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_assignment_dto_1.UpdateAssignmentDto]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "remove", null);
AssignmentsController = __decorate([
    (0, common_1.Controller)('assignments'),
    __metadata("design:paramtypes", [assignments_service_1.AssignmentsService])
], AssignmentsController);
exports.AssignmentsController = AssignmentsController;
//# sourceMappingURL=assignments.controller.js.map