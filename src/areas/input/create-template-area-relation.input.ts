import { IsNotEmpty } from 'class-validator';

export class CreateTemplateAreaRelationInput {
  @IsNotEmpty()
  areaId: string;

  @IsNotEmpty()
  templateId: string;
}
