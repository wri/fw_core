import { IsEnum } from 'class-validator';
import { ETemplateStatus } from '../models/template.schema';

export class UpdateStatusInput {
  @IsEnum(ETemplateStatus)
  status: ETemplateStatus;
}
