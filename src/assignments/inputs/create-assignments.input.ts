import { IGeojson } from '../../areas/models/area.entity';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateAssignmentInput {
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateAssignmentLocationInput)
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  location?: CreateAssignmentLocationInput[];

  @IsOptional()
  @IsObject()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  geostore?: IGeojson;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  priority: number;

  @IsArray()
  @IsNotEmpty({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  monitors: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  areaId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  templateIds?: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateAssignmentLocationInput {
  @IsOptional()
  @IsNotEmpty()
  alertId?: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  lat: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  lon: number;

  @IsOptional()
  @IsString()
  alertType?: string;
}
