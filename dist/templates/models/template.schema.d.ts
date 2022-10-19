import * as mongoose from "mongoose";
export declare enum ETemplateStatus {
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished"
}
interface ITemplateChildQuestion {
    type: string;
    label: mongoose.Schema.Types.Mixed;
    name: string;
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
    childQuestions?: ITemplateChildQuestion[];
    conditions?: {
        name?: string;
        value?: number;
    }[];
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
export declare class TemplateQuestion {
    type: string;
    label: mongoose.Schema.Types.Mixed;
    name: string;
    defaultValue: mongoose.Schema.Types.Mixed;
    values: mongoose.Schema.Types.Mixed;
    required: boolean;
    order?: number;
    childQuestions?: ITemplateChildQuestion[];
    conditions: {
        name?: string;
        value?: number;
    }[];
}
export declare class Template {
    name: mongoose.Schema.Types.Mixed;
    user: string;
    languages: mongoose.Schema.Types.Mixed[];
    defaultLanguage: string;
    public: boolean;
    status: ETemplateStatus;
    questions: ITemplateQuestion[];
    createdAt: string;
    answersCount?: number;
}
export interface TemplateDocument extends ITemplate, mongoose.Document {
}
export interface TemplateQuestionDocument extends ITemplateQuestion, mongoose.Document {
}
export interface ITemplateResponse {
    data: any;
}
export declare const TemplateQuestionSchema: mongoose.Schema<TemplateQuestion, mongoose.Model<TemplateQuestion, any, any, any>, any, any>;
export declare const TemplateSchema: mongoose.Schema<Template, mongoose.Model<Template, any, any, any>, any, any>;
export {};
