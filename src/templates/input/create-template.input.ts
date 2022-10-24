import { IsDefined, IsNotEmpty } from 'class-validator';
import { ETemplateStatus } from '../models/template.schema';

export class CreateTemplateInput {
  @IsDefined()
  @IsNotEmpty()
  name: string;

  @IsDefined()
  @IsNotEmpty()
  questions: [];

  @IsDefined()
  @IsNotEmpty()
  languages: [];

  @IsDefined()
  @IsNotEmpty()
  status: ETemplateStatus;

  public?: boolean;

  defaultLanguage: string;
}
