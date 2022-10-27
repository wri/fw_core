import mongoose from 'mongoose';
import { ETemplateStatus } from '../models/template.schema';

export class CreateTemplateDto {
  name: string;
  user: mongoose.Types.ObjectId;
  languages: mongoose.Schema.Types.Mixed[];
  defaultLanguage: string;
  public: boolean;
  status: ETemplateStatus;
  questions: CreateTemplateQuestionDto[];
  createdAt?: string;
  answersCount?: number;
  editGroupId?: mongoose.Types.ObjectId;
  isLatest?: boolean;
}

class CreateTemplateQuestionDto {
  type: string;
  label: mongoose.Schema.Types.Mixed;
  name: string;
  defaultValue?: mongoose.Schema.Types.Mixed;
  values: mongoose.Schema.Types.Mixed;
  required: boolean;
  order?: number;
  childQuestions?: CreateTemplateChildQuestionDto[];
  conditions?: { name?: string; value?: number }[];
}

class CreateTemplateChildQuestionDto {
  type: string;
  label: mongoose.Schema.Types.Mixed;
  name: string;
  defaultValue?: mongoose.Schema.Types.Mixed;
  values: mongoose.Schema.Types.Mixed;
  required: boolean;
  order?: number;
  conditionalValue?: number;
}
