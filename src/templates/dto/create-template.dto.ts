import mongoose from 'mongoose';
import { ETemplateStatus } from '../models/template.schema';

export class CreateTemplateDto {
  name: { [language: string]: string };
  user: mongoose.Types.ObjectId;
  languages: string[];
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
  label: { [language: string]: string };
  name: string;
  defaultValue?: number | string;
  values?: { [language: string]: { label: string; value: number }[] };
  required?: boolean;
  order?: number;
  childQuestions?: CreateTemplateChildQuestionDto[];
  conditions?: { name?: string; value?: number }[];
}

class CreateTemplateChildQuestionDto {
  type: string;
  label: { [language: string]: string };
  name: string;
  defaultValue?: number | string;
  values?: { [language: string]: { label: string; value: number }[] };
  required?: boolean;
  order?: number;
  conditionalValue?: number;
}
