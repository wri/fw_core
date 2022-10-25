import { ILocation, IPoint } from '../models/route.schema';

export class CreateRouteDto {
  areaId: string;
  destination: IPoint;
  difficulty: string;
  startDate: number;
  endDate: number;
  geostoreId: string;
  routeId: string;
  locations: ILocation[];
  name: string;
  createdBy?: string;
  id?: string;
  teamId: string;
  active?: boolean;
}
