import { IsDefined, IsNotEmpty } from 'class-validator';

export class CreateAreaDto {
  @IsDefined()
  @IsNotEmpty()
  name: string;
  @IsDefined()
  @IsNotEmpty()
  geojson: string;
}
