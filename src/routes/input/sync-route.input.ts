import {
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

class SyncRoutePointInput {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class SyncRouteLocationInput {
  @IsNumber()
  accuracy: number;

  @IsNumber()
  altitude: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  timestamp: number;
}

export class SyncRouteInput {
  @IsMongoId()
  areaId: string;

  @IsNotEmpty()
  @ValidateNested()
  destination: SyncRoutePointInput;

  @IsNotEmpty()
  difficulty: string;

  @IsInt()
  startDate: number;

  @IsInt()
  endDate: number;

  @IsNotEmpty()
  geostoreId: string;

  @IsArray()
  @ValidateNested({ each: true })
  locations: SyncRouteLocationInput[];

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsMongoId()
  teamId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
