import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateTemplateQuestionInput } from './create-template.input';

export class UpdateTemplateInput {
  @IsOptional()
  @IsDefined()
  @IsObject()
  name?: { [language: string]: string };

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  defaultLanguage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => CreateTemplateQuestionInput)
  questions?: CreateTemplateQuestionInput[];

  @IsOptional()
  @IsMongoId({ each: true })
  @IsArray()
  areaIds?: string[];
}
