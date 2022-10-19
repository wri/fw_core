import { AreasService } from '../services/areas.service';
import { CreateTemplateAreaRelationDto } from '../dto/createTemplateAreaRelation.dto';
import { TemplatesService } from '../../templates/templates.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TemplateAreaRelationDocument } from '../models/templateAreaRelation.schema';
export declare class TemplateAreaRelationController {
    private readonly areasService;
    private readonly templatesService;
    private readonly templateAreaRelationService;
    constructor(areasService: AreasService, templatesService: TemplatesService, templateAreaRelationService: TemplateAreaRelationService);
    private readonly logger;
    createTemplateAreaRelation(body: CreateTemplateAreaRelationDto): Promise<TemplateAreaRelationDocument>;
    deleteTemplateAreaRelation(body: CreateTemplateAreaRelationDto): Promise<void>;
    getAllTemplatesForArea(areaId: string): Promise<string[]>;
    deleteAllTemplateRelations(templateId: string): void;
    deleteAllAreaRelations(areaId: string): void;
}
