import { IGeojson } from '../../areas/models/area.entity';
import { AssignmentStatus } from '../assignment-status.enum';

export class CreateAssignmentDto {
  location: { lat: number; lon: number; alertType?: string }[];
  geostore?: IGeojson;
  priority: number;
  monitors: string[];
  notes: string;
  status: AssignmentStatus;
  areaId: string;
  templateIds: string[];
  createdBy?: string;
  name?: string;
}
