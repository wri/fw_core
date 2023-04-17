import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AreasService } from '../services/areas.service';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TeamDocument } from '../../teams/models/team.schema';
import { IArea, IAreaResponse } from '../models/area.entity';
import { ResponseService } from '../services/response.service';
import { TemplatesService } from '../../templates/templates.service';
import { IUser } from '../../common/user.model';
import { AuthUser } from '../../common/decorators';
import {
  EMemberRole,
  EMemberStatus,
} from '../../teams/models/teamMember.schema';

@Controller('areas')
export class AreasController {
  constructor(
    private readonly areasService: AreasService,
    private readonly responseService: ResponseService,
    private readonly teamsService: TeamsService,
    private readonly templatesService: TemplatesService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly templateAreaRelationService: TemplateAreaRelationService,
  ) {}

  private readonly logger = new Logger(AreasController.name);

  // GET /areas/user
  // Gets all areas the user has created
  @Get('/user')
  async getUserAreas(@AuthUser() user: IUser): Promise<IAreaResponse> {
    let data: IArea[] = [];
    if (user && user.id) {
      try {
        const areas = await this.areasService.getUserAreas(user);
        areas.forEach((area) => {
          if (area.attributes.userId !== user.id)
            throw new HttpException(
              'Incorrect areas found',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
        });
        try {
          data = await this.responseService.buildAreasResponse(areas, {}, user);
        } catch (error: any) {
          this.logger.error(
            "Error while retrieving area's geostore, template, and coverage",
            error,
          );
          throw new HttpException(
            "Error while retrieving area's geostore, template, and coverage",
            error.status,
          );
        }
      } catch (error: any) {
        this.logger.error('Error while retrieving areas', error);
        throw new HttpException('Error while retrieving areas', error.status);
      }
    }
    return {
      data: data.filter((area) => {
        if (typeof area.attributes.geostore !== 'string')
          return area.attributes.geostore.areaHa < 2000000;
        else return true;
      }),
    };
  }

  // GET /areas/userAndTeam
  // Gets all areas the user has created and all areas linked to the user's teams
  @Get('/userAndTeam')
  async getUserAndTeamAreas(@AuthUser() user: IUser): Promise<IAreaResponse> {
    let data: IArea[] = [];

    if (user && user.id) {
      try {
        const userAreas = await this.areasService.getUserAreas(user);
        userAreas.forEach((area) => {
          if (area.attributes.userId !== user.id)
            throw new HttpException(
              'Incorrect areas found',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          area.attributes.teamId = undefined;
        });
        // get a users teams
        const userTeams = await this.teamsService.findAllByUserId(user.id); // get list of user's teams
        /*         const filteredTeams = userTeams.filter((team) => {
          team.userRole !== EMemberRole.Left &&
            team.status !== EMemberStatus.Declined &&
            team.status !== EMemberStatus.Invited;
        }); */
        //get areas for each team
        const allTeamAreas: (IArea | null)[] = userAreas;
        for await (const team of userTeams) {
          const teamAreas: string[] =
            await this.teamAreaRelationService.getAllAreasForTeam(team.id);
          const fullTeamAreas: Promise<IArea | null>[] = [];
          // get full area for each array member and push to user areas array
          for await (const teamAreaId of teamAreas) {
            const area = this.areasService.getAreaMICROSERVICE(teamAreaId);
            fullTeamAreas.push(area);
          }
          const resolvedTeamAreas = await Promise.all(fullTeamAreas);
          resolvedTeamAreas.forEach((area) => {
            if (area) area.attributes.teamId = team.id;
          });
          allTeamAreas.push(...resolvedTeamAreas);
        }
        // format areas
        data = await this.responseService.buildAreasResponse(
          userAreas,
          {},
          user,
        );
      } catch (error: any) {
        throw new HttpException(
          'Failed to get user and team areas',
          error.status,
        );
      }
    }
    return {
      data: data.filter((area) => {
        if (typeof area.attributes.geostore !== 'string')
          return area.attributes.geostore.areaHa < 2000000;
        else return true;
      }),
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { dest: './tmp' }))
  async createArea(
    @UploadedFile() image: Express.Multer.File,
    @AuthUser() user: IUser,
    @Body() body: CreateAreaDto,
  ): Promise<IAreaResponse> {
    if (!body.name)
      throw new HttpException(
        'Request must contain a name',
        HttpStatus.BAD_REQUEST,
      );
    if (!body.geojson)
      throw new HttpException(
        'Request must contain a geojson',
        HttpStatus.BAD_REQUEST,
      );
    if (!image)
      throw new HttpException(
        'Request must contain an image',
        HttpStatus.BAD_REQUEST,
      );
    const { geojson, name } = body;
    let data;
    if (user && user.id) {
      try {
        const { area, geostore, coverage } =
          await this.areasService.createAreaWithGeostore(
            { name, image },
            JSON.parse(geojson),
            user,
          );
        this.logger.log(`Created area with id ${area.id}`);
        try {
          [data] = await this.responseService.buildAreasResponse(
            [area],
            { geostoreObj: geostore, coverageObj: coverage },
            user,
          );
        } catch (error) {
          this.logger.error('Error while building area response', error);
        }
      } catch (error) {
        this.logger.error('Error while creating area', error);
      }
    }
    return { data };
  }

  // GET /area/:id
  // get an area user created or that is part of a team
  @Get('/:id')
  async findOneArea(
    @AuthUser() user: IUser,
    @Param('id') id: string,
  ): Promise<IAreaResponse> {
    // see if area is a team area
    // get user teams
    const userTeams: TeamDocument[] = await this.teamsService.findAllByUserId(
      user.id,
    ); // get list of user's teams
    const areaTeams: string[] =
      await this.teamAreaRelationService.getAllTeamsForArea(id); // get list of teams associated with area
    const filteredTeams: TeamDocument[] = userTeams.filter((userTeam) =>
      areaTeams.includes(userTeam.id),
    ); // match area teams to user teams

    const area =
      filteredTeams.length > 0
        ? await this.areasService.getAreaMICROSERVICE(id)
        : await this.areasService.getArea(id, user);

    if (!area) throw new NotFoundException();

    const [data] = await this.responseService.buildAreasResponse(
      [area],
      {},
      user,
    );

    return { data };
  }

  @Patch('/:id') // TODO sort out geostore - id or full object?
  @UseInterceptors(FileInterceptor('image', { dest: './tmp' }))
  async updateArea(
    @UploadedFile() image: Express.Multer.File,
    @AuthUser() user: IUser,
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
  ): Promise<IAreaResponse> {
    // get the area
    const existingArea = await this.areasService.getArea(id, user);
    if (!existingArea)
      throw new HttpException('Area not found', HttpStatus.NOT_FOUND);

    const { geojson, name } = updateAreaDto;

    let data: any;
    if (user && user.id) {
      try {
        const { area, coverage } =
          await this.areasService.updateAreaWithGeostore(
            {
              name,
              image,
            },
            geojson ? JSON.parse(geojson) : null,
            existingArea,
            user,
          );
        try {
          [data] = await this.responseService.buildAreasResponse(
            [area],
            {
              coverage,
            },
            user,
          );
        } catch (e: any) {
          this.logger.error(e);
          throw new HttpException(
            'Error while building area response',
            e.status,
          );
        }
      } catch (e: any) {
        this.logger.error(e);
        throw new HttpException('Error while updating area', e.status);
      }
    }
    return { data };
  }

  @Delete('/:id')
  async deleteOneArea(
    @Param('id') id: string,
    @AuthUser() user: IUser,
  ): Promise<any> {
    const area = await this.areasService.getArea(id, user);

    if (!area) throw new ForbiddenException();

    if (area.attributes.userId.toString() !== user.id.toString())
      throw new HttpException(
        'You are not authorised to delete this record',
        HttpStatus.FORBIDDEN,
      );

    await this.areasService.delete(id, user);

    // delete area relations
    await this.teamAreaRelationService.delete({ areaId: id });
    await this.templateAreaRelationService.deleteMany({ areaId: id });

    return { data: id };
  }
}
