export declare class GeostoreService {
    private readonly logger;
    createGeostore(geojson: any, token: string): Promise<any>;
    getGeostore(geostoreId: any, token: string): Promise<any>;
}
