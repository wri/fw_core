import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
export declare class RoutesService {
    create(createRouteDto: CreateRouteDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateRouteDto: UpdateRouteDto): string;
    remove(id: string): string;
}
