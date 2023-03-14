import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route, RouteDocument } from './models/route.schema';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { UserService } from '../common/user.service';

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name, 'formsDb')
    private routeModel: Model<RouteDocument>,
    private readonly userService: UserService,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<RouteDocument> {
    const routeToCreate = new this.routeModel(createRouteDto);
    const savedRoute = await routeToCreate.save();

    return savedRoute;
  }

  async findAll(filter): Promise<RouteDocument[]> {
    return await this.addUsernameToRoutes(await this.routeModel.find(filter));
  }

  async findOneById(id: string): Promise<RouteDocument | null> {
    const [route] = await this.addUsernameToRoutes([
      await this.routeModel.findById(new mongoose.Types.ObjectId(id)),
    ]);
    return route;
  }

  async findOne(filter): Promise<RouteDocument | null> {
    const [route] = await this.addUsernameToRoutes([
      await this.routeModel.findOne(filter),
    ]);
    return route;
  }

  update(id: string, _updateRouteDto: UpdateRouteDto) {
    return `This action updates a #${id} route`;
  }

  async deactivate(id: string): Promise<void> {
    const route = await this.findOneById(id);

    if (!route) return;

    route.active = false;
    await route.save();
  }

  async addUsernameToRoutes(routes): Promise<RouteDocument[]> {
    for await (const route of routes) {
      if (route)
        route.username = await this.userService.getNameByIdMICROSERVICE(
          route.createdBy,
        );
    }
    return routes;
  }
}
