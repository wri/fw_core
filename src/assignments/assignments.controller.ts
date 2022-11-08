import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
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
import { UserService } from '../common/user.service';
import { TemplatesService } from '../templates/templates.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplateDocument } from '../templates/models/template.schema';

@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly areasService: AreasService,
    private readonly geostoreService: GeostoreService,
    private readonly userService: UserService,
    private readonly templateService: TemplatesService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { dest: './tmp' }))
  async create(
    @UploadedFile() image: Express.Multer.File,
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
      image,
    );

    const [assignmentResponse] = await this.buildAssignmentResponse(
      [createdAssignment],
      user,
    );

    return { data: serializeAssignments(assignmentResponse) };
  }

  // Gets all user assignments - that is,
  // - all assignments created by the user
  // - all assignments assigned to the user
  // - all assignments assigned to monitors of teams the user is manager of
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
  @UseInterceptors(FileInterceptor('image', { dest: './tmp' }))
  async update(
    @UploadedFile() image: Express.Multer.File,
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
      image,
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
      if (typeof assignment.geostore === 'string') {
        const geostoreId = assignment.geostore;
        const geostore = await this.geostoreService.getGeostore(
          geostoreId,
          user.token ?? '',
        );

        assignment.geostore = geostore ?? assignment.geostore;
      }

      // get monitor names
      const monitorNames: { id: string; name: string }[] = await Promise.all(
        assignment.monitors.map(async (monitor) => {
          const name = await this.userService.getNameByIdMICROSERVICE(monitor);
          return { id: monitor, name };
        }),
      );

      assignment.monitorNames = monitorNames;

      // get templates
      const templates: (TemplateDocument | null)[] = await Promise.all(
        assignment.templateIds.map(async (templateId) => {
          return await this.templateService.findById(templateId);
        }),
      );

      assignment.templates = templates;
      return assignment;
    });

    return Promise.all(assignmentResponsePromises);
  }
}
