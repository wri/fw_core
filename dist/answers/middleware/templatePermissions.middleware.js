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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatePermissionsMiddleware = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = __importDefault(require("mongoose"));
const teamMember_schema_1 = require("../../teams/models/teamMember.schema");
const templates_service_1 = require("../../templates/templates.service");
const teamMembers_service_1 = require("../../teams/services/teamMembers.service");
const teams_service_1 = require("../../teams/services/teams.service");
let TemplatePermissionsMiddleware = class TemplatePermissionsMiddleware {
    constructor(teamsService, teamMembersService, templatesService) {
        this.teamsService = teamsService;
        this.teamMembersService = teamMembersService;
        this.templatesService = templatesService;
    }
    use(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, params } = req;
            const teams = yield this.teamsService.findAllByUserId(user.id);
            const managers = [];
            for (const team of teams) {
                let teamUsers = yield this.teamMembersService.findAllTeamMembers(team.id, teamMember_schema_1.EMemberRole.Manager);
                if (!teamUsers)
                    teamUsers = [];
                let teamManagers = teamUsers.filter(teamUser => teamUser.role === teamMember_schema_1.EMemberRole.Manager || teamUser.role === teamMember_schema_1.EMemberRole.Administrator);
                teamManagers.forEach(manager => managers.push({ user: new mongoose_1.default.Types.ObjectId(manager.userId) }));
            }
            let filters = {};
            if (teams.length > 0) {
                filters = {
                    $and: [
                        { _id: new mongoose_1.default.Types.ObjectId(params.templateId) },
                        {
                            $or: [{ public: true }, { user: new mongoose_1.default.Types.ObjectId(user.id) }, ...managers]
                        }
                    ]
                };
            }
            else {
                filters = {
                    $and: [
                        { _id: new mongoose_1.default.Types.ObjectId(params.templateId) },
                        {
                            $or: [{ public: true }, { user: new mongoose_1.default.Types.ObjectId(user.id) }]
                        }
                    ]
                };
            }
            const template = yield this.templatesService.findOne(filters);
            if (!template) {
                throw new common_1.HttpException("Template not found", common_1.HttpStatus.NOT_FOUND);
            }
            req.template = template;
            req.userTeams = teams;
            next();
        });
    }
};
TemplatePermissionsMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [teams_service_1.TeamsService,
        teamMembers_service_1.TeamMembersService,
        templates_service_1.TemplatesService])
], TemplatePermissionsMiddleware);
exports.TemplatePermissionsMiddleware = TemplatePermissionsMiddleware;
;
//# sourceMappingURL=templatePermissions.middleware.js.map