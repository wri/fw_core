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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Request } from 'express';
import mongoose from 'mongoose';
import {
  AssignmentDocument,
  IAssignmentResponse,
} from './models/assignment.schema';
import serializeAssignments from './serializers/assignments.serializer';
import { AreasService } from '../areas/services/areas.service';
import { IUser } from '../common/user.model';
import { GeostoreService } from '../areas/services/geostore.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly areasService: AreasService,
    private readonly geostoreService: GeostoreService,
  ) {}

  @Post()
  async create(
    @Req() request: Request,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;
    const createdAssignment = await this.assignmentsService.create(
      createAssignmentDto,
      user,
    );

    const [assignmentResponse] = await this.buildAssignmentResponse(
      [createdAssignment],
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/user')
  async findUserAssignments(
    @Req() request: Request,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;
    const assignments = await this.assignmentsService.findUser(user.id);

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/teams')
  async findTeamAssignments(
    @Req() request: Request,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;
    const assignments = await this.assignmentsService.findTeams(user.id);

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/allOpenUserForArea/:areaId')
  async findAllOpenAssignmentsForArea(
    @Req() request: Request,
    @Param('areaId') areaId: string,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;

    const area = await this.areasService.getAreaMICROSERVICE(areaId);
    if (!area)
      throw new HttpException('This area does not exist', HttpStatus.NOT_FOUND);

    const assignments = await this.assignmentsService.findOpenForArea(
      user.id,
      areaId,
    );

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/open')
  async findOpenAssignments(
    @Req() request: Request,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;
    const assignments = await this.assignmentsService.findOpen(user.id);

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/areas/:areaId')
  async findAreaAssignments(
    @Req() request: Request,
    @Param('areaId') areaId: string,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;

    const area = await this.areasService.getAreaMICROSERVICE(areaId);
    if (!area)
      throw new HttpException('This area does not exist', HttpStatus.NOT_FOUND);

    const assignments = await this.assignmentsService.findAreas(
      user.id,
      areaId,
    );

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/:id')
  async findOne(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;
    const assignment = await this.assignmentsService.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!assignment)
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    // get area for area name
    const area = await this.areasService.getAreaMICROSERVICE(assignment.areaId);
    assignment.areaName = area.attributes.name;

    const [assignmentResponse] = await this.buildAssignmentResponse(
      [assignment],
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Patch('/:id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<IAssignmentResponse> {
    const user = request.user!;
    const filter = {
      createdBy: user.id,
      status: { $in: ['open', 'on hold'] },
      _id: new mongoose.Types.ObjectId(id),
    };
    const assignment = await this.assignmentsService.findOne(filter);
    if (!assignment)
      throw new HttpException(
        'You do not have access to edit this resource',
        HttpStatus.FORBIDDEN,
      );

    const updatedAssignment = await this.assignmentsService.update(
      id,
      updateAssignmentDto,
    );

    const [assignmentResponse] = await this.buildAssignmentResponse(
      [updatedAssignment],
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Delete('/:id')
  async remove(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const user = request.user!;
    const filter = {
      createdBy: user.id,
      _id: new mongoose.Types.ObjectId(id),
    };
    const assignment = await this.assignmentsService.findOne(filter);
    if (!assignment)
      throw new HttpException(
        'You do not have access to delete this resource',
        HttpStatus.FORBIDDEN,
      );

    return await this.assignmentsService.remove(id);
  }

  async buildAssignmentResponse(
    assignments: AssignmentDocument[],
    user: IUser,
  ): Promise<AssignmentDocument[]> {
    const assignmentsToReturn = Promise.all(
      assignments.map(async (assignment) => {
        assignment.geostore = await this.geostoreService.getGeostore(
          assignment.geostore,
          user.token ?? '',
        );
        return assignment;
      }),
    );

    return assignmentsToReturn;
  }
}
