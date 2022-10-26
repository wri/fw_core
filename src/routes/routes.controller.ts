import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { Request } from 'express';
import serializeRoutes from './serializers/routes.serializer';
import { TeamsService } from '../teams/services/teams.service';

@Controller('routes')
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly teamsService: TeamsService,
  ) {}

  @Post('/sync')
  async create(
    @Req() request: Request,
    @Body() routesToSync: CreateRouteDto[],
  ) {
    const syncedRoutes = [];

    for await (const route of routesToSync) {
      const existingRoute = await this.routesService.findOne({
        routeId: route.id,
      });
      if (existingRoute) continue;

      route.createdBy = request.user.id;
      route.routeId = route.id;
      route.active = true;
      delete route.id;
      const savedRoute = await this.routesService.create(route);
      syncedRoutes.push(savedRoute);
    }

    return { data: serializeRoutes(syncedRoutes) };
  }

  @Get('/user')
  async findAllUser(@Req() request: Request) {
    // get all active routes
    const filter = {
      createdBy: request.user.id,
      active: true,
    };
    const routes = await this.routesService.findAll(filter);
    return { data: serializeRoutes(routes) };
  }

  @Get('/teams')
  async findAllTeams(@Req() request: Request) {
    // find all user teams
    const teams = await this.teamsService.findAllByUserId(request.user.id);

    const filter = {
      teamId: { $in: teams.map((team) => team.id) },
      active: true,
    };

    const routes = await this.routesService.findAll(filter);
    return { data: serializeRoutes(routes) };
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return { data: serializeRoutes(await this.routesService.findOneById(id)) };
  }

  /*   @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(id, updateRouteDto);
  } */

  @Delete('/:id')
  async remove(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<void> {
    // only manager of team or route creator can do this
    const route = await this.routesService.findOneById(id);
    if (!route)
      throw new HttpException("This route doesn't exist", HttpStatus.NOT_FOUND);
    // check user is manager of route team
    const managedTeams = await this.teamsService.findAllManagedTeams(
      request.user.id,
    );
    if (
      !managedTeams.includes(route.teamId) &&
      route.createdBy !== request.user.id
    )
      throw new HttpException(
        'You cannot delete this route',
        HttpStatus.FORBIDDEN,
      );
    await this.routesService.deactivate(id);
  }
}
