import { IsDefined, IsNotEmpty } from 'class-validator';

export class CreateTemplateAreaRelationDto {
  @IsDefined()
  @IsNotEmpty()
  areaId: string;
  @IsDefined()
  @IsNotEmpty()
  templateId: string;
}
