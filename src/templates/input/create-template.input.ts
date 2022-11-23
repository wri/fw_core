import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ETemplateStatus } from '../models/template.schema';

export class CreateTemplateInput {
  @IsDefined()
  @IsObject()
  name: { [language: string]: string };

  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty({ each: true })
  languages: string[];

  @IsString()
  @IsNotEmpty()
  defaultLanguage: string;

  @IsEnum(ETemplateStatus)
  status: ETemplateStatus;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => CreateTemplateQuestionInput)
  questions: CreateTemplateQuestionInput[];

  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @IsOptional()
  @IsNumberString()
  createdAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  areaIds?: string[];
}

export class CreateTemplateQuestionInput {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDefined()
  @IsObject()
  label: { [language: string]: string };

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  defaultValue?: number | string;

  @IsOptional()
  @IsObject()
  values?: { [language: string]: { label: string; value: number }[] };

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(10)
  maxImageCount?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateChildQuestionInput)
  childQuestions?: CreateTemplateChildQuestionInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  conditions?: CreateTemplateQuestionConditionInput[];
}

class CreateTemplateQuestionConditionInput {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  value?: number;
}

class CreateTemplateChildQuestionInput {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsDefined()
  label: { [language: string]: string };

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  defaultValue?: number | string;

  @IsOptional()
  @IsObject()
  values?: { [language: string]: { label: string; value: number }[] };

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(10)
  maxImageCount?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  conditions?: CreateTemplateQuestionConditionInput[];
}
