/// <reference types="multer" />
import { AreasService } from '../services/areas.service';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { IAreaResponse } from '../models/area.entity';
import { Request } from "express";
import { ResponseService } from '../services/response.service';
import { TemplatesService } from '../../templates/templates.service';
export declare class AreasController {
    private readonly areasService;
    private readonly responseService;
    private readonly teamsService;
    private readonly templatesService;
    private readonly teamAreaRelationService;
    private readonly templateAreaRelationService;
    constructor(areasService: AreasService, responseService: ResponseService, teamsService: TeamsService, templatesService: TemplatesService, teamAreaRelationService: TeamAreaRelationService, templateAreaRelationService: TemplateAreaRelationService);
    private readonly logger;
    getUserAreas(request: Request): Promise<IAreaResponse>;
    getUserAndTeamAreas(request: Request): Promise<IAreaResponse>;
    createArea(image: Express.Multer.File, request: Request, body: CreateAreaDto): Promise<IAreaResponse>;
    findOneArea(request: Request, id: string): Promise<IAreaResponse>;
    updateArea(image: Express.Multer.File, id: string, request: Request, updateAreaDto: UpdateAreaDto): Promise<IAreaResponse>;
    deleteOneArea(id: string, request: Request): Promise<string>;
}
