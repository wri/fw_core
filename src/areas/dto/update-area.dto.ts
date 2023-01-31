import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateAreaDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  geojson?: string;
}
