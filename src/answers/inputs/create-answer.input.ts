import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  isString,
  ValidateNested,
} from 'class-validator';

export class CreateAnswerInput {
  @IsNotEmpty()
  reportName: string;

  @IsNotEmpty()
  language: string;

  @IsOptional()
  @IsMongoId()
  areaOfInterest?: string;

  @IsOptional()
  @IsNotEmpty()
  areaOfInterestName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @ArrayMinSize(2)
  @IsNumberString({}, { each: true })
  @Transform(({ value }) => (isString(value) ? value.split(',') : value))
  userPosition?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Transform(({ value }) => (isString(value) ? JSON.parse(value) : value))
  clickedPosition?: CreateAnswerPositionInput[];

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  date?: number;

  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @IsOptional()
  @IsMongoId()
  assignmentId?: string;

  [questionName: string]:
    | string
    | string[]
    | number
    | CreateAnswerPositionInput[]
    | undefined;
}

class CreateAnswerPositionInput {
  @Transform(({ value }) => Number(value))
  lat: number;

  @Transform(({ value }) => Number(value))
  lon: number;
}
