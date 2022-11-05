/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export enum ETemplateStatus {
  PUBLISHED = 'published',
  UNPUBLISHED = 'unpublished',
}

interface ITemplateChildQuestion {
  type: string;
  label: { [language: string]: string };
  name: string;
  defaultValue?: number;
  values?: { [language: string]: { label: string; value: number }[] };
  required: boolean;
  order?: number;
  conditionalValue?: number;
}

export interface ITemplateQuestion {
  type: string;
  label: { [language: string]: string };
  name: string;
  defaultValue?: number;
  values?: { [language: string]: { label: string; value: number }[] };
  required: boolean;
  order?: number;
  childQuestions?: ITemplateChildQuestion[];
  conditions?: { name?: string; value?: number }[];
}

export interface ITemplate {
  name: { [language: string]: string };
  user: mongoose.Types.ObjectId;
  languages: string[];
  defaultLanguage: string;
  public: boolean;
  status: ETemplateStatus;
  createdAt: string;
  questions: ITemplateQuestion[];
  answersCount?: number;
  editGroupId?: mongoose.Types.ObjectId;
  isLatest?: boolean;
  areas?: { id: string | undefined; name: string | undefined }[];
}

@Schema()
export class TemplateQuestion {
  @Prop({ required: true, trim: true })
  type: string;

  @Prop({ required: true, default: {} })
  label: mongoose.Schema.Types.Mixed;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  defaultValue: mongoose.Schema.Types.Mixed;

  @Prop({ required: true, default: {} })
  values: mongoose.Schema.Types.Mixed;

  @Prop({ required: true, default: false })
  required: boolean;

  @Prop()
  order?: number;

  @Prop()
  childQuestions?: ITemplateChildQuestion[];

  @Prop()
  conditions: { name?: string; value?: number }[];
}

@Schema()
export class Template {
  @Prop({ required: true, default: {} })
  name: mongoose.Schema.Types.Mixed;

  @Prop({ required: true })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, default: false })
  languages: mongoose.Schema.Types.Mixed[];

  @Prop({ required: true, trim: true })
  defaultLanguage: string;

  @Prop({ required: true, default: false })
  public: boolean;

  @Prop({ required: true, trim: true, default: 'unpublished' })
  status: ETemplateStatus;

  @Prop({ required: true })
  questions: ITemplateQuestion[];

  @Prop({ required: true, default: Date.now })
  createdAt: string;

  @Prop({ required: false })
  answersCount?: number;

  @Prop()
  editGroupId?: mongoose.Schema.Types.ObjectId;

  @Prop()
  isLatest?: boolean;

  @Prop()
  areas?: { id: string | undefined; name: string | undefined }[];
}

export interface TemplateDocument extends ITemplate, mongoose.Document {}
export interface TemplateQuestionDocument
  extends ITemplateQuestion,
    mongoose.Document {}

export interface ITemplateResponse {
  data: any;
}

export const TemplateQuestionSchema =
  SchemaFactory.createForClass(TemplateQuestion);
export const TemplateSchema = SchemaFactory.createForClass(Template);
