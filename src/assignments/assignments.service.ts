import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import {
  Assignment,
  AssignmentDocument,
  IAssignment,
} from './models/assignment.schema';
import { Model } from 'mongoose';
import { TeamsService } from '../teams/services/teams.service';
import mongoose from 'mongoose';
import { AreasService } from '../areas/services/areas.service';
import { GeostoreService } from '../areas/services/geostore.service';
import { IUser } from '../common/user.model';
import { S3Service } from '../answers/services/s3Service';

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
    private readonly s3Service: S3Service,
  ) {}

  async create(
    assignmentDto: CreateAssignmentDto,
    user: IUser,
    image?: Express.Multer.File,
  ): Promise<AssignmentDocument> {
    // get number of assignments in area for assignment name code
    const count = await this.assignmentModel.count({ createdBy: user.id });
    const area = await this.areasService.getAreaMICROSERVICE(
      assignmentDto.areaId,
    );

    if (!area)
      throw new HttpException('Area does not exist', HttpStatus.NOT_FOUND);

    if (!['open', 'on hold', 'completed'].includes(assignmentDto.status))
      throw new HttpException(
        "Status must be one of 'open', 'on hold', 'completed'",
        HttpStatus.BAD_REQUEST,
      );

    if (assignmentDto.location && !Array.isArray(assignmentDto.location))
      throw new HttpException(
        'location should be an array of objects in the form {lat: number, lon: number, alertType: string}',
        HttpStatus.BAD_REQUEST,
      );
    if (assignmentDto.location)
      assignmentDto.location.forEach((obj) => {
        if (!(obj.lat && obj.lon))
          throw new HttpException(
            'location should be an array of objects in the form {lat: number, lon: number, alertType: string}',
            HttpStatus.BAD_REQUEST,
          );
      });
    const userInitials = user.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'null';

    const newAssignment: IAssignment = {
      ...assignmentDto,
      geostore: undefined,
      createdBy: user.id,
      createdAt: Date.now(),
      name: `${userInitials}-${String(count + 1).padStart(4, '0')}`,
    };

    // save image
    if (image) {
      const url = await this.s3Service.uploadFile(image.path, image.filename);
      newAssignment.image = url;
    }

    // create geostore
    if (assignmentDto.geostore) {
      const geostore = await this.geostoreService.createGeostore(
        assignmentDto.geostore,
        user.token ?? '',
      );
      newAssignment.geostore = geostore.id;
    }

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
    return await this.assignmentModel.find({
      areaId,
    });
  }

  async update(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
    image?: Express.Multer.File,
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

    // save image
    if (image) {
      const url = await this.s3Service.uploadFile(image.path, image.filename);
      assignmentToUpdate.image = url;
    }

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
