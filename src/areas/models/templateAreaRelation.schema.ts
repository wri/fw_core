import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as mongoose from "mongoose";

export interface ITemplateAreaRelation {
    templateId: string;
    areaId: string;
  }

@Schema()
export class TemplateAreaRelation {
    @Prop({required: true})
    templateId: string;

    @Prop({required: true})
    areaId: string;
}

export interface TemplateAreaRelationDocument extends ITemplateAreaRelation, mongoose.Document {}

export const TemplateAreaRelationSchema = SchemaFactory.createForClass(TemplateAreaRelation);