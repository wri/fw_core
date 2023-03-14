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

export interface IGeostore {
  id: string;
  geojson: IGeojson;
  hash: string;
  provider: any;
  areaHa: number;
  bbox: number[];
  lock: boolean;
  info: any;
}
