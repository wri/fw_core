import { TemplatesService } from './templates.service';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Request } from "express";
import { AnswersService } from '../answers/services/answers.service';
import { ITemplateResponse } from './models/template.schema';
import { IAnswerReturn } from '../answers/models/answer.model';
import { TeamsService } from '../teams/services/teams.service';
import { TemplateAreaRelationService } from '../areas/services/templateAreaRelation.service';
export declare class TemplatesController {
    private readonly templatesService;
    private readonly answersService;
    private readonly teamsService;
    private readonly templateAreaRelationService;
    constructor(templatesService: TemplatesService, answersService: AnswersService, teamsService: TeamsService, templateAreaRelationService: TemplateAreaRelationService);
    private readonly logger;
    create(request: Request): Promise<ITemplateResponse>;
    findAll(request: Request): Promise<ITemplateResponse>;
    getAllAnswersForUser(request: Request): Promise<IAnswerReturn>;
    findOne(id: string, request: Request): Promise<ITemplateResponse>;
    update(id: string, body: UpdateTemplateDto, request: Request): Promise<ITemplateResponse>;
    deleteAllAnswers(request: Request): Promise<void>;
    remove(id: string, request: Request): Promise<void>;
}
