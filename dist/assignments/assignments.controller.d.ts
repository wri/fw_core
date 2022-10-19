import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Request } from "express";
import { IAssignmentResponse } from './models/assignment.schema';
export declare class AssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: AssignmentsService);
    create(request: Request, createAssignmentDto: CreateAssignmentDto): Promise<IAssignmentResponse>;
    findUserAssignments(request: Request): Promise<IAssignmentResponse>;
    findTeamAssignments(request: Request): Promise<IAssignmentResponse>;
    findAreaAssignments(request: Request, areaId: string): Promise<IAssignmentResponse>;
    findOne(id: string): Promise<IAssignmentResponse>;
    update(request: Request, id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<IAssignmentResponse>;
    remove(request: Request, id: string): Promise<void>;
}
