import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export interface ILocation {
  accuracy: number;
  altitude: number;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface IPoint {
  latitude: number;
  longitude: number;
}

export interface IRoute {
  areaId: string;
  destination: IPoint;
  difficulty: string;
  startDate: number;
  endDate: number;
  geostoreId: string;
  routeId: string | undefined;
  locations: ILocation[];
  name: string;
  createdBy: string;
  teamId?: string;
  active: boolean;
  username?: string;
}

@Schema()
export class Route {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  locations: mongoose.Schema.Types.Mixed;

  @Prop({ required: true })
  areaId: string;

  @Prop({ required: true })
  destination: mongoose.Schema.Types.Mixed;

  @Prop({ required: true })
  difficulty: string;

  @Prop({ required: true })
  startDate: number;

  @Prop({ required: true })
  endDate: number;

  @Prop({ required: true })
  geostoreId: string;

  @Prop({ required: true })
  routeId: string;

  @Prop({ required: false })
  teamId: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  active: boolean;

  @Prop({ required: false })
  username: string;
}

export interface RouteDocument extends IRoute, mongoose.Document {}

export interface IRouteResponse {
  data: any;
}

export const RouteSchema = SchemaFactory.createForClass(Route);
