import { TemplateDocument } from '../../templates/models/template.schema';
import { IGeojson } from '../../areas/models/area.entity';
import { AssignmentStatus } from '../assignment-status.enum';

export class CreateAssignmentDto {
  location?: {
    lat: number;
    lon: number;
    alertType?: string;
    alertId?: string;
  }[];
  geostore?: IGeojson;
  priority: number;
  monitors: string[];
  notes?: string;
  status?: AssignmentStatus;
  areaId: string;
  templateIds: string[];
  createdBy?: string;
  name?: string;
  monitorNames?: { id: string; name: string }[];
  templates?: (TemplateDocument | null)[];
}
