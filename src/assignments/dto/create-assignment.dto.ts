import { IGeojson } from '../../areas/models/area.entity';

export class CreateAssignmentDto {
  location: { lat: number; lon: number; alertType: string };
  geostore?: IGeojson;
  priority: number;
  monitors: string[];
  notes: string;
  status: string;
  areaId: string;
  templateId: string;
  teamIds: string[];
  createdBy?: string;
  name?: string;
}
