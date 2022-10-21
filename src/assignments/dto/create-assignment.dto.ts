export class CreateAssignmentDto {
  location: { lat: number; lon: number };
  priority: number;
  monitors: string[];
  notes: string;
  status: string;
  alert: string;
  areaId: string;
  templateId: string;
  teamIds: string[];
  createdBy?: string;
  name?: string;
}
