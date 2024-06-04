import { Test, TestingModule } from '@nestjs/testing';
import { AnswersService } from './answers.service';
import answerModel, {
  Answer,
  AnswerDocument,
  IAnswerResponse,
} from '../models/answer.model';
import { getModelToken } from '@nestjs/mongoose';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { UserService } from '../../common/user.service';
import { TemplatesService } from '../../templates/templates.service';
import { S3Service } from './s3Service';
import { TeamsService } from '../../teams/services/teams.service';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const mockS3Service = {
  generatePresignedUrl: jest.fn(),
};

const mockAnswer = {
  report: new ObjectId(), // mongoose.Types.ObjectId(),
  reportName: 'name',
  language: 'en',
  user: new mongoose.Types.ObjectId(),
  createdAt: new Date().toString(),
};

describe('AnswerService', () => {
  let answerService: AnswersService;
  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        { provide: getModelToken(Answer.name, 'formsDb'), useValue: jest.fn() },
        { provide: TeamsService, useValue: jest.fn() },
        { provide: TeamMembersService, useValue: jest.fn() },
        { provide: TeamAreaRelationService, useValue: jest.fn() },
        { provide: UserService, useValue: jest.fn() },
        { provide: TemplatesService, useValue: jest.fn() },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    answerService = module.get<AnswersService>(AnswersService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(answerService).toBeDefined();
  });

  describe('responseType', () => {
    it('should return string with no value', async () => {
      const string_response: IAnswerResponse = {
        name: 'name',
      };
      const string_result = answerService.responseType(string_response);
      expect(string_result).toBe('string');
    });

    it('should return string', async () => {
      const string_response: IAnswerResponse = {
        name: 'name',
        value: 'some string',
      };
      const string_result = answerService.responseType(string_response);
      expect(string_result).toBe('string');
    });

    it('should return string_array', async () => {
      const string_array_response: IAnswerResponse = {
        name: 'name',
        value: ['some string', 'some other string'],
      };
      const string_array_result = answerService.responseType(
        string_array_response,
      );
      expect(string_array_result).toBe('string_array');
    });

    it('should return url_array', async () => {
      const url_array_response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: 'some string', isPublic: false },
          { url: 'some other string', isPublic: false },
        ],
      };
      const url_array_result = answerService.responseType(url_array_response);
      expect(url_array_result).toBe('url_array');
    });

    it('should return url_object', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: { url: 'some string', isPublic: false },
      };
      const url_object_result = answerService.responseType(url_object_response);
      expect(url_object_result).toBe('url_object');
    });
  });

  describe('getUrls', () => {
    it('should replace urls with presigned urls for url_object', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'generatePresignedUrl')
        .mockResolvedValue('presigned');
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: { url: 'some string', isPublic: false },
      };
      const answer = new answerModel({
        ...mockAnswer,
        responses: [url_object_response],
      });

      const result = await answerService.getUrls(
        answer as any as AnswerDocument,
      );

      const value = result.responses[0].value;
      expect(value).toMatchObject({
        url: 'presigned',
      });
      expect(s3Spy).toHaveBeenCalledTimes(1);
    });

    it('should replace urls with presigned urls for url_array', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'generatePresignedUrl')
        .mockResolvedValue('presigned');
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: 'some string', isPublic: false },
          { url: 'some other string', isPublic: true },
        ],
      };
      const answer = new answerModel({
        ...mockAnswer,
        responses: [url_object_response],
      });

      const result = await answerService.getUrls(
        answer as any as AnswerDocument,
      );

      const value = result.responses[0].value;
      if (!Array.isArray(value)) throw new Error();
      expect(value[0]).toMatchObject({
        url: 'presigned',
        isPublic: false,
      });
      expect(value[1]).toMatchObject({
        url: 'presigned',
        isPublic: true,
      });
      expect(s3Spy).toHaveBeenCalledTimes(2);
    });

    it('should leave string responses alone', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'generatePresignedUrl')
        .mockResolvedValue('presigned');
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: 'some url',
      };
      const answer = new answerModel({
        ...mockAnswer,
        responses: [url_object_response],
      });

      const result = await answerService.getUrls(
        answer as any as AnswerDocument,
      );

      const value = result.responses[0].value;
      expect(value).toBe('some url');
      expect(s3Spy).toHaveBeenCalledTimes(0);
    });

    it('should leave string arrays alone', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'generatePresignedUrl')
        .mockResolvedValue('presigned');
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: ['some url', 'some other url'],
      };
      const answer = new answerModel({
        ...mockAnswer,
        responses: [url_object_response],
      });

      const result = await answerService.getUrls(
        answer as any as AnswerDocument,
      );

      const value = result.responses[0].value;
      expect(value).toHaveLength(2);
      if (!Array.isArray(value)) throw new Error();
      expect(value[0]).toBe('some url');
      expect(value[1]).toBe('some other url');
      expect(s3Spy).toHaveBeenCalledTimes(0);
    });
  });
});
