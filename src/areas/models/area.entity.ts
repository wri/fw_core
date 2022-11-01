import { ITemplate } from 'src/templates/models/template.schema';
import { IGeostore } from './geostore.entity';

export class Area {}

interface IFeature {
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  type: string;
}

export interface IGeojson {
  crs?: any;
  type: string;
  features: IFeature[];
}

export interface IArea {
  type: string;
  id: string;
  attributes: {
    name: string;
    application: string;
    geostore: IGeostore | string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    image: string;
    env: string;
    datasets: IDataset[];
    use: any;
    iso: any;
    coverage: any;
    teamId?: string;
    teams?: { id: string; name: string }[];
    reportTemplate?: ITemplate[];
  };
}

export interface IDataset {
  slug: string;
  name: string;
  active: boolean;
  startDate: string;
  endDate: string;
}

export interface IAreaResponse {
  data: IArea | IArea[];
}
