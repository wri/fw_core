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
  ParseEnumPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
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
import { CreateAssignmentInput } from './inputs/create-assignments.input';
import { AssignmentStatus } from './assignment-status.enum';

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
    @Body() input: CreateAssignmentInput,
    @AuthUser() user: IUser,
  ): Promise<IAssignmentResponse> {
    if (!(input.location || input.geostore))
      throw new BadRequestException(
        'Assignment must contain either a location, alert or geojson',
      ); // alerts are included in the createAssignmentDto.location field

    const area = await this.areasService.getAreaMICROSERVICE(input.areaId);

    if (!area) throw new BadRequestException('Area does not exist');

    if (input.location && !Array.isArray(input.location))
      throw new BadRequestException(
        'location should be an array of objects in the form {lat: number, lon: number, alertType: string}',
      );

    const createdAssignment = await this.assignmentsService.create(
      {
        ...input,
        status: AssignmentStatus.OPEN,
        templateIds: input.templateIds ?? [],
      },
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

  @Patch('/:id/status')
  async updateStatus(
    @AuthUser() user: IUser,
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(AssignmentStatus))
    status: AssignmentStatus,
  ) {
    const assignment = await this.assignmentsService.findById(id);

    if (!assignment) throw new NotFoundException('Assignment not found');

    const isCreator = assignment.createdBy === user.id;

    if (isCreator) {
      assignment.status = status;
      await assignment.save();
      return { data: serializeAssignments(assignment) };
    }

    if (status === AssignmentStatus.COMPLETED)
      throw new ForbiddenException(
        'Only creator can change status to completed',
      );

    if (assignment.status === AssignmentStatus.COMPLETED)
      throw new ForbiddenException(
        'Only creator can change status from completed',
      );

    assignment.status = status;
    await assignment.save();

    return { data: serializeAssignments(assignment) };
  }

  @Delete('/deleteAllForUser')
  async removeAll(@AuthUser() user: IUser): Promise<void> {
    const filter = { createdBy: user.id };
    return await this.assignmentsService.removeMany(filter);
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
