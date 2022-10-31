import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment, AssignmentDocument } from './models/assignment.schema';
import { Model } from 'mongoose';
import { TeamsService } from '../teams/services/teams.service';
import mongoose from 'mongoose';
import { AreasService } from '../areas/services/areas.service';
import { GeostoreService } from '../areas/services/geostore.service';
import { IUser } from 'src/common/user.model';

const allowedKeys = [
  'name',
  'priority',
  'monitors',
  'notes',
  'status',
  'templateIds',
];

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name, 'formsDb')
    private assignmentModel: Model<AssignmentDocument>,
    private readonly teamsService: TeamsService,
    private readonly areasService: AreasService,
    private readonly geostoreService: GeostoreService,
  ) {}

  async create(
    assignment: CreateAssignmentDto,
    user: IUser,
  ): Promise<AssignmentDocument> {
    // get number of assignments in area for assignment name code
    const count = await this.assignmentModel.count({ createdBy: user.id });
    const area = await this.areasService.getAreaMICROSERVICE(assignment.areaId);

    if (!area)
      throw new HttpException('Area does not exist', HttpStatus.NOT_FOUND);

    if (!['open', 'on hold', 'completed'].includes(assignment.status))
      throw new HttpException(
        "Status must be one of 'open', 'on hold', 'completed'",
        HttpStatus.BAD_REQUEST,
      );

    if (
      assignment.location &&
      !(assignment.location.lat && assignment.location.lon)
    )
      throw new HttpException(
        'location should be in the form {lat: number, lon: number, alertType: string}',
        HttpStatus.BAD_REQUEST,
      );

    const userInitials = user.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'null';

    // create geostore
    const geostore = await this.geostoreService.createGeostore(
      assignment.geostore,
      user.token ?? '',
    );

    const newAssignment = {
      ...assignment,
      createdBy: user.id,
      geostore: geostore?.id,
      name: `${userInitials}-${String(count + 1).padStart(4, '0')}`,
    };

    const assignmentToSave = new this.assignmentModel(newAssignment);
    return await assignmentToSave.save();
  }

  async findOne(
    filter: mongoose.FilterQuery<AssignmentDocument>,
  ): Promise<AssignmentDocument | null> {
    return await this.assignmentModel.findOne(filter);
  }

  async findUser(userId: string): Promise<AssignmentDocument[]> {
    return await this.assignmentModel.find({ monitors: userId });
  }

  /*   async findTeams(userId: string): Promise<AssignmentDocument[]> {
    // get all user team ids
    const teams = await this.teamsService.findAllByUserId(userId);
    const teamIds = teams.map((team) => team.id);

    return await this.assignmentModel.find({ teamIds: { $in: teamIds } });
  } */

  async findOpen(userId: string): Promise<AssignmentDocument[]> {
    return await this.assignmentModel.find({
      monitors: userId,
      status: { $in: ['open', 'on hold'] },
    });
  }

  async findOpenForArea(
    userId: string,
    areaId: string,
  ): Promise<AssignmentDocument[]> {
    return await this.assignmentModel.find({
      $and: [
        { $or: [{ monitors: userId }, { createdBy: userId }] },
        { status: { $in: ['open', 'on hold'] } },
        { areaId: areaId },
      ],
    });
  }

  async findAreas(
    userId: string,
    areaId: string,
  ): Promise<AssignmentDocument[]> {
    // get all user team ids
    //const teams = await this.teamsService.findAllByUserId(userId);
    //const teamIds = teams.map((team) => team.id);

    return await this.assignmentModel.find({
      //teamIds: { $in: teamIds },
      areaId,
    });
  }

  async update(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<AssignmentDocument> {
    const assignmentToUpdate = await this.assignmentModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!assignmentToUpdate) throw new NotFoundException();

    if (
      updateAssignmentDto.status &&
      !['open', 'on hold', 'completed'].includes(updateAssignmentDto.status)
    )
      throw new HttpException(
        "Status must be one of 'open', 'on hold', 'completed'",
        HttpStatus.BAD_REQUEST,
      );

    for (const [key, value] of Object.entries(updateAssignmentDto)) {
      if (!allowedKeys.includes(key)) continue;
      assignmentToUpdate[key] = value;
    }

    const updatedAssignment = await assignmentToUpdate.save();
    return updatedAssignment;
  }

  async remove(id: string): Promise<void> {
    await this.assignmentModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
    });
  }
}
