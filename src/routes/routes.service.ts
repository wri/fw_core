import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route, RouteDocument } from './models/route.schema';
import { Model } from 'mongoose';
import mongoose from 'mongoose';

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name, 'formsDb')
    private routeModel: Model<RouteDocument>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<RouteDocument> {
    const routeToCreate = new this.routeModel(createRouteDto);
    const savedRoute = await routeToCreate.save();

    return savedRoute;
  }

  async findAll(filter): Promise<RouteDocument[]> {
    return await this.routeModel.find(filter);
  }

  async findOneById(id: string): Promise<RouteDocument> {
    return await this.routeModel.findById(new mongoose.Types.ObjectId(id));
  }

  async findOne(filter): Promise<RouteDocument> {
    return await this.routeModel.findOne(filter);
  }

  update(id: string, updateRouteDto: UpdateRouteDto) {
    return `This action updates a #${id} route`;
  }

  async deactivate(id: string): Promise<void> {
    const route = await this.findOneById(id);
    route.active = false;
    await route.save();
  }
}
