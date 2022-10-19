import * as mongoose from "mongoose";
export interface ITemplateAreaRelation {
    templateId: string;
    areaId: string;
}
export declare class TemplateAreaRelation {
    templateId: string;
    areaId: string;
}
export interface TemplateAreaRelationDocument extends ITemplateAreaRelation, mongoose.Document {
}
export declare const TemplateAreaRelationSchema: mongoose.Schema<TemplateAreaRelation, mongoose.Model<TemplateAreaRelation, any, any, any>, any, any>;
