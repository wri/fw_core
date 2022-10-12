import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment, AssignmentDocument } from './models/assignment.schema';
import { Model } from 'mongoose';
import { TeamsService } from '../teams/services/teams.service';
import mongoose from 'mongoose';

const allowedKeys = [
  'name',
  'priority',
  'monitors',
  'notes',
  'status',
  'areaId',
  'templateId',
  'teamIds'
]

@Injectable()
export class AssignmentsService {

  constructor(
    @InjectModel(Assignment.name, 'formsDb') private assignmentModel: Model<AssignmentDocument>,
    private readonly teamsService: TeamsService,
  ) { }

  async create(assignment: CreateAssignmentDto): Promise<AssignmentDocument> {
    const assignmentToSave = new this.assignmentModel(assignment)
    return await assignmentToSave.save();
  }

  async findOne(filter): Promise<AssignmentDocument> {
    return await this.assignmentModel.findOne(filter);
  }

  async findUser(userId: string): Promise<AssignmentDocument[]> {
    return await this.assignmentModel.find({monitors: userId});
  }

  async findTeams(userId: string): Promise<AssignmentDocument[]> {

    // get all user team ids
    const teams = await this.teamsService.findAllByUserId(userId)
    const teamIds = teams.map(team => team.id)

    return await this.assignmentModel.find({teamIds: {$in: teamIds}})
  }

  async findAreas(userId: string, areaId: string): Promise<AssignmentDocument[]> {

    // get all user team ids
    const teams = await this.teamsService.findAllByUserId(userId)
    const teamIds = teams.map(team => team.id)

    return await this.assignmentModel.find({teamIds: {$in: teamIds}, areaId})
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<AssignmentDocument> {
    let assignmentToUpdate = await this.assignmentModel.findOne({_id: new mongoose.Types.ObjectId(id)})

    for(const [key, value] of Object.entries(updateAssignmentDto)) {
      if(!allowedKeys.includes(key)) continue;
      assignmentToUpdate[key] = value;
    }

    const updatedAssignment = await assignmentToUpdate.save();
    return updatedAssignment;

  }

  async remove(id: string): Promise<void> {
    await this.assignmentModel.findOneAndDelete({_id: new mongoose.Types.ObjectId(id)})
    return null
  }
}
