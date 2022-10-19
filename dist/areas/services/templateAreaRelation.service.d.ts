import { Model } from 'mongoose';
import { TemplateAreaRelationDocument } from "../models/templateAreaRelation.schema";
export declare class TemplateAreaRelationService {
    private templateAreaRelationModel;
    constructor(templateAreaRelationModel: Model<TemplateAreaRelationDocument>);
    create({ areaId, templateId }: {
        areaId: any;
        templateId: any;
    }): Promise<TemplateAreaRelationDocument>;
    find(filter: any): Promise<TemplateAreaRelationDocument[]>;
    delete(filter: any): Promise<void>;
}
