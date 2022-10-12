import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpException, HttpStatus } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Request } from "express";
import mongoose from 'mongoose';
import { IAssignmentResponse } from './models/assignment.schema';
import serializeAssignments from './serializers/assignments.serializer';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  async create(@Req() request: Request, @Body() createAssignmentDto: CreateAssignmentDto): Promise<IAssignmentResponse> {
    const createdAssignment = await this.assignmentsService.create({
      ...createAssignmentDto,
      createdBy: request.user.id
    });

    return { data: serializeAssignments(createdAssignment)}
  }

  @Get('/user')
  async findUserAssignments(@Req() request: Request): Promise<IAssignmentResponse> {
    const {user} = request
    const assignments = await this.assignmentsService.findUser(user.id);

    return { data: serializeAssignments(assignments)}
  }

  @Get('/teams')
  async findTeamAssignments(@Req() request: Request): Promise<IAssignmentResponse> {
    const {user} = request
    const assignments = await this.assignmentsService.findTeams(user.id);

    return { data: serializeAssignments(assignments)}
  }

  @Get('/areas/:areaId')
  async findAreaAssignments(@Req() request: Request, @Param('areaId') areaId: string): Promise<IAssignmentResponse> {
    const { user } = request
    const assignments = await this.assignmentsService.findAreas(user.id, areaId);

    return { data: serializeAssignments(assignments)}
  }

  @Get('/:id')
  async findOne(@Param('id') id: string): Promise<IAssignmentResponse> {
    const assignment = await this.assignmentsService.findOne({_id: new mongoose.Types.ObjectId(id)});

    return { data: serializeAssignments(assignment)}
  }

  @Patch('/:id')
  async update(@Req() request: Request, @Param('id') id: string, @Body() updateAssignmentDto: UpdateAssignmentDto): Promise<IAssignmentResponse> {

    const filter = {
      createdBy: request.user.id,
      status: "incomplete",
      _id: new mongoose.Types.ObjectId(id)
    }
    const assignment = await this.assignmentsService.findOne(filter)
    if(!assignment) throw new HttpException('You do not have access to edit this resource', HttpStatus.FORBIDDEN)

    const updatedAssignment = await this.assignmentsService.update(id, updateAssignmentDto);

    return { data: serializeAssignments(updatedAssignment)}
  }

  @Delete('/:id')
  async remove(@Req() request: Request, @Param('id') id: string): Promise<void> {
    const filter = {
      createdBy: request.user.id,
      _id: new mongoose.Types.ObjectId(id)
    }
    const assignment = await this.assignmentsService.findOne(filter)
    if(!assignment) throw new HttpException('You do not have access to delete this resource', HttpStatus.FORBIDDEN)

    return await this.assignmentsService.remove(id);
  }
}
