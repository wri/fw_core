import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentDocument } from './models/assignment.schema';
import { Model } from 'mongoose';
import { TeamsService } from '../teams/services/teams.service';
export declare class AssignmentsService {
    private assignmentModel;
    private readonly teamsService;
    constructor(assignmentModel: Model<AssignmentDocument>, teamsService: TeamsService);
    create(assignment: CreateAssignmentDto): Promise<AssignmentDocument>;
    findOne(filter: any): Promise<AssignmentDocument>;
    findUser(userId: string): Promise<AssignmentDocument[]>;
    findTeams(userId: string): Promise<AssignmentDocument[]>;
    findAreas(userId: string, areaId: string): Promise<AssignmentDocument[]>;
    update(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<AssignmentDocument>;
    remove(id: string): Promise<void>;
}
