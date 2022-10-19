/// <reference types="multer" />
import { AnswersService } from './services/answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { Request } from "express";
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { S3Service } from './services/s3Service';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';
export declare class AnswersController {
    private readonly answersService;
    private readonly teamMembersService;
    private readonly teamAreaRelationService;
    private readonly s3Service;
    constructor(answersService: AnswersService, teamMembersService: TeamMembersService, teamAreaRelationService: TeamAreaRelationService, s3Service: S3Service);
    create(fileArray: Array<Express.Multer.File>, fields: CreateAnswerDto, request: Request): Promise<{
        data: {
            type: string;
            id: any;
            attributes: {};
        } | {
            type: string;
            id: any;
            attributes: {};
        }[];
    }>;
    getAreaAnswers(request: Request, areaId: string): Promise<{
        data: {
            type: string;
            id: any;
            attributes: {};
        } | {
            type: string;
            id: any;
            attributes: {};
        }[];
    }>;
    findAll(request: Request): Promise<{
        data: {
            type: string;
            id: any;
            attributes: {};
        } | {
            type: string;
            id: any;
            attributes: {};
        }[];
    }>;
    findOne(id: string, request: Request): Promise<{
        data: {
            type: string;
            id: any;
            attributes: {};
        } | {
            type: string;
            id: any;
            attributes: {};
        }[];
    }>;
    update(id: string, updateAnswerDto: UpdateAnswerDto): string;
    remove(id: string, request: Request): Promise<void>;
}
