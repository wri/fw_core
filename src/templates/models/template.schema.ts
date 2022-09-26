import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import * as mongoose from "mongoose";

export enum ETemplateStatus {
    PUBLISHED = 'published',
    UNPUBLISHED = 'unpublished'
}

interface ITemplateChildQuestion {
    type: string;
    label: mongoose.Schema.Types.Mixed;
    name: string
    defaultValue?: mongoose.Schema.Types.Mixed;
    values: mongoose.Schema.Types.Mixed;
    required: boolean;
    order?: number;
    conditionalValue?: number;
}

export interface ITemplateQuestion {
    type: string;
    label: mongoose.Schema.Types.Mixed;
    name: string;
    defaultValue?: mongoose.Schema.Types.Mixed;
    values: mongoose.Schema.Types.Mixed;
    required: boolean;
    order?: number;
    childQuestions?: ITemplateChildQuestion[]
    conditions?: {name?: string, value?: number}[]
}

export interface ITemplate {
    name: string;
    user: string;
    languages: mongoose.Schema.Types.Mixed[];
    defaultLanguage: string;
    public: boolean;
    status: ETemplateStatus;
    createdAt: string;
    questions: ITemplateQuestion[];
    answersCount?: number;
  }

@Schema()
export class TemplateQuestion {
    @Prop({required: true, trim: true})
    type: string;

    @Prop({required: true, default: {}})
    label: mongoose.Schema.Types.Mixed;

    @Prop({required: true, trim: true})
    name: string;

    @Prop({required: false, trim: true})
    defaultValue: mongoose.Schema.Types.Mixed;

    @Prop({required: true, default: {}})
    values: mongoose.Schema.Types.Mixed;

    @Prop({required: true, default: false})
    required: boolean;

    @Prop({required: true, default: false})
    order?: number;

    @Prop({required: true})
    childQuestions?: ITemplateChildQuestion[]

    @Prop({required: true})
    conditions: {name?: string, value?: number}[]
}

@Schema()
export class Template {
    @Prop({required: true, default: {}})
    name: mongoose.Schema.Types.Mixed;

    @Prop({required: true})
    user: string;

    @Prop({required: true, default: false})
    languages: mongoose.Schema.Types.Mixed[];

    @Prop({required: true, trim: true})
    defaultLanguage: string;

    @Prop({required: true, default: false})
    public: boolean;

    @Prop({required: true, trim: true, default: "unpublished"})
    status: ETemplateStatus;
    
    @Prop({required: true})
    questions: ITemplateQuestion[]

    @Prop({required: true, default: Date.now})
    createdAt: string;
}

export interface TemplateDocument extends ITemplate, mongoose.Document {}
export interface TemplateQuestionDocument extends ITemplateQuestion, mongoose.Document {}

export interface ITemplateResponse {
  data: any;
}

export const TemplateQuestionSchema = SchemaFactory.createForClass(TemplateQuestion)
export const TemplateSchema = SchemaFactory.createForClass(Template);