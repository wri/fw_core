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
import { IAssignmentResponse } from './models/assignment.schema';
import serializeAssignments from './serializers/assignments.serializer';
import { AreasService } from '../areas/services/areas.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly areasService: AreasService,
  ) {}

  @Post()
  async create(
    @Req() request: Request,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ): Promise<IAssignmentResponse> {
    const createdAssignment = await this.assignmentsService.create(
      createAssignmentDto,
      request.user,
    );

    return { data: serializeAssignments(createdAssignment) };
  }

  @Get('/user')
  async findUserAssignments(
    @Req() request: Request,
  ): Promise<IAssignmentResponse> {
    const { user } = request;
    const assignments = await this.assignmentsService.findUser(user.id);

    return { data: serializeAssignments(assignments) };
  }

  @Get('/teams')
  async findTeamAssignments(
    @Req() request: Request,
  ): Promise<IAssignmentResponse> {
    const { user } = request;
    const assignments = await this.assignmentsService.findTeams(user.id);

    return { data: serializeAssignments(assignments) };
  }

  @Get('/open')
  async findOpenAssignments(
    @Req() request: Request,
  ): Promise<IAssignmentResponse> {
    const { user } = request;
    const assignments = await this.assignmentsService.findOpen(user.id);

    return { data: serializeAssignments(assignments) };
  }

  @Get('/areas/:areaId')
  async findAreaAssignments(
    @Req() request: Request,
    @Param('areaId') areaId: string,
  ): Promise<IAssignmentResponse> {
    const { user } = request;
    const assignments = await this.assignmentsService.findAreas(
      user.id,
      areaId,
    );

    return { data: serializeAssignments(assignments) };
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<IAssignmentResponse> {
    const assignment = await this.assignmentsService.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!assignment)
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    // get area for area name
    const area = await this.areasService.getAreaMICROSERVICE(assignment.areaId);
    if (area) assignment.areaName = area.attributes.name;
    else assignment.areaName = null;

    return { data: serializeAssignments(assignment) };
  }

  @Patch('/:id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<IAssignmentResponse> {
    const filter = {
      createdBy: request.user.id,
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

    return { data: serializeAssignments(updatedAssignment) };
  }

  @Delete('/:id')
  async remove(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const filter = {
      createdBy: request.user.id,
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
}
