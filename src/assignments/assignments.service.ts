import {
  BadRequestException,
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
import { TeamMembersService } from '../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { GeostoreService } from '../areas/services/geostore.service';
import { IUser } from '../common/user.model';
import { S3Service } from '../answers/services/s3Service';
import { MongooseObjectId } from '../common/objectId';
import { TeamsService } from '../teams/services/teams.service';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';

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
    private readonly teamMembersService: TeamMembersService,
    private readonly teamsService: TeamsService,
    private readonly teamAreaRelationService: TeamAreaRelationService,
    private readonly geostoreService: GeostoreService,
    private readonly s3Service: S3Service,
  ) {}

  async findById(
    id: string | MongooseObjectId,
  ): Promise<AssignmentDocument | null> {
    return this.assignmentModel.findById(id);
  }

  async create(
    assignmentDto: CreateAssignmentDto,
    user: IUser,
    image?: Express.Multer.File,
  ): Promise<AssignmentDocument> {
    // get number of assignments in area for assignment name code
    const count = await this.assignmentModel.count({ createdBy: user.id });

    const userInitials = user.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : 'null';

    const newAssignment: IAssignment = {
      ...assignmentDto,
      status: 'open',
      geostore: undefined,
      createdBy: user.id,
      createdAt: Date.now(),
      name: `${userInitials}-${String(count + 1).padStart(4, '0')}`,
    };

    // save image
    if (image) {
      const url = await this.s3Service.uploadFile(
        image.path,
        image.originalname,
      );
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
    // get user's team members
    const teamMembers = await this.teamMembersService.findEveryTeamMember(
      userId,
    );
    teamMembers.push(userId);
    // get user teams areas
    const teams = await this.teamsService.findAllByUserId(userId);
    const areas: string[] = [];
    for await (const team of teams) {
      const relations: string[] =
        await this.teamAreaRelationService.getAllAreasForTeam(team.id);
      areas.push(...relations);
    }
    // either assignments linked to you or team members associated with areas linked to you through teams
    return await this.assignmentModel.find({
      $and: [
        { areaId: { $in: areas } },
        {
          $or: [
            { monitors: { $in: teamMembers } },
            { createdBy: { $in: teamMembers } },
          ],
        },
      ],
    });
  }

  async findOpen(userId: string): Promise<AssignmentDocument[]> {
    const teamMembers = await this.teamMembersService.findEveryTeamMember(
      userId,
    );
    teamMembers.push(userId);
    return await this.assignmentModel.find({
      monitors: { $in: teamMembers },
      status: { $in: ['open', 'on hold'] },
    });
  }

  async findOpenForArea(
    userId: string,
    areaId: string,
  ): Promise<AssignmentDocument[]> {
    const teamMembers = await this.teamMembersService.findEveryTeamMember(
      userId,
    );
    teamMembers.push(userId);
    return await this.assignmentModel.find({
      $and: [
        { $or: [{ monitors: { $in: teamMembers } }, { createdBy: userId }] },
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
      const url = await this.s3Service.uploadFile(
        image.path,
        image.originalname,
      );
      assignmentToUpdate.image = url;
    }

    for (const [key, value] of Object.entries(updateAssignmentDto)) {
      if (!allowedKeys.includes(key))
        throw new BadRequestException(
          'You cannot update one or more of the requested fields',
        );
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

  async removeMany(filter): Promise<void> {
    await this.assignmentModel.deleteMany(filter);
  }
}
