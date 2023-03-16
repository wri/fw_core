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
  @Transform(({ value }) => {
    return isString(value)
      ? value.split(',').map((item) => item.trim())
      : value;
  })
  @IsNumberString({}, { each: true })
  userPosition?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Transform(({ value }) => (isString(value) ? JSON.parse(value) : value))
  clickedPosition?: CreateAnswerPositionInput[];

  @IsOptional()
  //@Transform(({ value }) => Number(value))
  date?: string;

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
