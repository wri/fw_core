import { GeostoreService } from './geostore.service';
import { CoverageService } from './coverage.service';
import { DatasetService } from './dataset.service';
import { IArea, IGeojson } from '../models/area.entity';
import { IUser } from '../../common/user.model';
export declare class AreasService {
    private readonly geostoreService;
    private readonly coverageService;
    private readonly datasetService;
    constructor(geostoreService: GeostoreService, coverageService: CoverageService, datasetService: DatasetService);
    private readonly logger;
    getArea(areaId: string, user: IUser): Promise<IArea>;
    getAreaMICROSERVICE(areaId: string): Promise<IArea>;
    getUserAreas(user: IUser): Promise<IArea[]>;
    createAreaWithGeostore({ name, image }: {
        name: any;
        image: any;
    }, geojson: any, user: any): Promise<any>;
    updateAreaWithGeostore({ name, image }: {
        name: any;
        image: any;
    }, geojson: IGeojson, existingArea: IArea, user: IUser): Promise<{
        geostoreId: any;
        area: any;
        coverage: any;
    }>;
    delete(areaId: string, user: IUser): Promise<IArea>;
}
