import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  ParseArrayPipe,
  ForbiddenException,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import serializeRoutes from './serializers/routes.serializer';
import { TeamsService } from '../teams/services/teams.service';
import { RouteDocument } from './models/route.schema';
import mongoose from 'mongoose';
import { AuthUser } from '../common/decorators';
import { IUser } from '../common/user.model';
import { SyncRouteInput } from './input/sync-route.input';
import { MongooseObjectId } from '../common/objectId';
import { isMongoId } from 'class-validator';

@Controller('routes')
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly teamsService: TeamsService,
  ) {}

  @Post('/sync')
  async create(
    @AuthUser() user: IUser,
    @Body(new ParseArrayPipe({ items: SyncRouteInput }))
    body: SyncRouteInput[],
  ) {
    const syncedRoutes: RouteDocument[] = [];

    for await (const route of body) {
      const existingRoute = await this.routesService.findOne(
        isMongoId(route.id)
          ? { _id: new MongooseObjectId(route.id) }
          : { routeId: route.id },
      );
      if (existingRoute || !route.id) continue;

      const createRouteDto: CreateRouteDto = {
        ...route,
        createdBy: user.id,
        routeId: route.id,
        active: true,
      };

      delete createRouteDto.id;

      const savedRoute = await this.routesService.create(createRouteDto);
      syncedRoutes.push(savedRoute);
    }

    return { data: serializeRoutes(syncedRoutes) };
  }

  @Get('/team/:teamId/area/:areaId')
  async findAllUserAndTeamArea(
    @AuthUser() user: IUser,
    @Param('teamId') teamId: string,
    @Param('areaId') areaId: string,
  ) {
    // active routes created by the user or with the team and area ids
    const filter: mongoose.FilterQuery<any> = {
      $and: [
        {
          $or: [{ teamId: teamId }, { createdBy: user.id }],
        },
        { areaId: areaId },
      ],
    };
    return { data: serializeRoutes(await this.routesService.findAll(filter)) };
  }

  @Get('/user')
  async findAllUser(@AuthUser() user: IUser) {
    // get all active routes
    const filter = {
      createdBy: user.id,
    };
    const routes = await this.routesService.findAll(filter);
    return { data: serializeRoutes(routes) };
  }

  @Get('/teams')
  async findAllTeams(@AuthUser() user: IUser) {
    // find all user teams
    const teams = await this.teamsService.findAllByUserId(user.id);

    const filter = {
      teamId: { $in: teams.map((team) => team.id) },
    };

    const routes = await this.routesService.findAll(filter);
    return { data: serializeRoutes(routes) };
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return { data: serializeRoutes(await this.routesService.findOneById(id)) };
  }

  @Delete('/:id')
  async remove(
    @AuthUser() user: IUser,
    @Param('id') id: string,
  ): Promise<void> {
    // only manager of team or route creator can do this
    const route = await this.routesService.findOneById(id);
    if (!route)
      throw new HttpException("This route doesn't exist", HttpStatus.NOT_FOUND);

    // if user is creator then hard delete
    if (route.createdBy === user.id) {
      await route.deleteOne();
      return;
    }

    // if user is not creator but a manager then soft delete
    if (!route.teamId)
      throw new ForbiddenException(
        "User doesn't have permission to delete this route",
      );

    // check user is manager of route team
    const managedTeams = await this.teamsService.findAllManagedTeams(user.id);
    if (!managedTeams.includes(route.teamId))
      throw new ForbiddenException('User cannot delete this route');

    await this.routesService.deactivate(id);
  }
}
