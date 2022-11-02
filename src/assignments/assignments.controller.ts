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
  BadRequestException,
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
import { AuthUser } from '../common/decorators';

@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly areasService: AreasService,
    private readonly geostoreService: GeostoreService,
  ) {}

  @Post()
  async create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @AuthUser() user: IUser,
  ): Promise<IAssignmentResponse> {
    if (!(createAssignmentDto.location || createAssignmentDto.geostore))
      throw new BadRequestException(
        'Assignment must contain either a location, alert or geojson',
      ); // alerts are included in the createAssignmentDto.location field

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
    @AuthUser() user: IUser,
  ): Promise<IAssignmentResponse> {
    const assignments = await this.assignmentsService.findUser(user.id);

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/allOpenUserForArea/:areaId')
  async findAllOpenAssignmentsForArea(
    @AuthUser() user: IUser,
    @Param('areaId') areaId: string,
  ): Promise<IAssignmentResponse> {
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
    @AuthUser() user: IUser,
  ): Promise<IAssignmentResponse> {
    const assignments = await this.assignmentsService.findOpen(user.id);

    const assignmentResponse = await this.buildAssignmentResponse(
      assignments,
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Get('/areas/:areaId')
  async findAreaAssignments(
    @Param('areaId') areaId: string,
    @AuthUser() user: IUser,
  ): Promise<IAssignmentResponse> {
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
    @AuthUser() user: IUser,
    @Param('id') id: string,
  ): Promise<IAssignmentResponse> {
    const assignment = await this.assignmentsService.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!assignment)
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    // get area for area name
    const area = await this.areasService.getAreaMICROSERVICE(assignment.areaId);
    assignment.areaName = area?.attributes.name;

    const [assignmentResponse] = await this.buildAssignmentResponse(
      [assignment],
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @AuthUser() user: IUser,
  ): Promise<IAssignmentResponse> {
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
    @AuthUser() user: IUser,
    @Param('id') id: string,
  ): Promise<void> {
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
    const assignmentResponsePromises = assignments.map(async (assignment) => {
      if (!assignment.geostore || typeof assignment.geostore !== 'string')
        return assignment;

      const geostoreId = assignment.geostore;
      const geostore = await this.geostoreService.getGeostore(
        geostoreId,
        user.token ?? '',
      );

      assignment.geostore = geostore ?? assignment.geostore;

      return assignment;
    });

    return Promise.all(assignmentResponsePromises);
  }
}
