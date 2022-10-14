import { IGeojson } from "../../areas/models/area.entity";

export class CreateAssignmentDto {
    location: IGeojson;
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
