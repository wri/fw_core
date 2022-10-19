import { IUser } from "../../common/user.model";
import { IArea } from "../models/area.entity";
import { GeostoreService } from "./geostore.service";
import { CoverageService } from "./coverage.service";
import { DatasetService } from "./dataset.service";
import { TemplateAreaRelationService } from "./templateAreaRelation.service";
import { TemplatesService } from "../../templates/templates.service";
import { TeamsService } from "../../teams/services/teams.service";
import { TeamAreaRelationService } from "./teamAreaRelation.service";
export declare class ResponseService {
    private readonly geostoreService;
    private readonly coverageService;
    private readonly datasetService;
    private readonly templateAreaRelationService;
    private readonly teamAreaRelationService;
    private readonly templatesService;
    private readonly teamsService;
    constructor(geostoreService: GeostoreService, coverageService: CoverageService, datasetService: DatasetService, templateAreaRelationService: TemplateAreaRelationService, teamAreaRelationService: TeamAreaRelationService, templatesService: TemplatesService, teamsService: TeamsService);
    buildAreasResponse(areas: IArea[], objects: any, user: IUser): Promise<{
        attributes: {
            geostore: any;
            datasets: any;
            coverage: any;
            reportTemplate: any;
            teams: any;
            name: string;
            application: string;
            userId: string;
            createdAt: string;
            updatedAt: string;
            image: string;
            env: string;
            use: any;
            iso: any;
            teamId?: string;
        };
        type: string;
        id: string;
    }[]>;
}
