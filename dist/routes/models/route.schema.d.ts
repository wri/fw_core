import * as mongoose from "mongoose";
interface ILocation {
    accuracy: number;
    altitude: number;
    latitude: number;
    longitude: number;
    timestamp: number;
}
interface IPoint {
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
    routeId: string;
    locations: ILocation[];
    name: string;
}
export declare class Route {
    name: string;
    locations: mongoose.Schema.Types.Mixed;
    areaId: string;
    destination: mongoose.Schema.Types.Mixed;
    difficulty: string;
    startDate: number;
    endDate: number;
    geostoreId: string;
    routeId: string;
}
export interface RouteDocument extends IRoute, mongoose.Document {
}
export interface IRouteResponse {
    data: any;
}
export declare const RouteSchema: mongoose.Schema<Route, mongoose.Model<Route, any, any, any>, any, any>;
export {};
