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
import { faker } from '@faker-js/faker';

const mockS3Service = {
  generatePresignedUrl: jest.fn(),
  updateFile: jest.fn(),
};

const mockAnswer = {
  report: new mongoose.Types.ObjectId(),
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
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => key,
          },
        },
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

  describe('isStringType', () => {
    it('should return true for string', async () => {
      const string_response: IAnswerResponse = {
        name: 'name',
        value: 'some string',
      };
      const string_result = answerService.isStringType(string_response.value);
      expect(string_result).toBe(true);
    });

    it('should return false for a string array', async () => {
      const string_array_response: IAnswerResponse = {
        name: 'name',
        value: ['some string', 'some other string'],
      };
      const string_array_result = answerService.isStringType(
        string_array_response.value,
      );
      expect(string_array_result).toBe(false);
    });

    it('should return false for url array', async () => {
      const url_array_response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: 'some string', isPublic: false },
          { url: 'some other string', isPublic: false },
        ],
      };
      const url_array_result = answerService.isStringType(
        url_array_response.value,
      );
      expect(url_array_result).toBe(false);
    });

    it('should return false for url object', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: { url: 'some string', isPublic: false },
      };
      const url_object_result = answerService.isStringType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
    });

    it('should return false for undefined', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
      };
      const url_object_result = answerService.isStringType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
    });
  });

  describe('isStringArrayType', () => {
    it('should return false for string', async () => {
      const string_response: IAnswerResponse = {
        name: 'name',
        value: 'some string',
      };
      const string_result = answerService.isStringArrayType(
        string_response.value,
      );
      expect(string_result).toBe(false);
    });

    it('should return true for a string array', async () => {
      const string_array_response: IAnswerResponse = {
        name: 'name',
        value: ['some string', 'some other string'],
      };
      const string_array_result = answerService.isStringArrayType(
        string_array_response.value,
      );
      expect(string_array_result).toBe(true);
    });

    it('should return false for url array', async () => {
      const url_array_response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: 'some string', isPublic: false },
          { url: 'some other string', isPublic: false },
        ],
      };
      const url_array_result = answerService.isStringArrayType(
        url_array_response.value,
      );
      expect(url_array_result).toBe(false);
    });

    it('should return false for url object', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: { url: 'some string', isPublic: false },
      };
      const url_object_result = answerService.isStringArrayType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
    });

    it('should return false for undefined', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
      };
      const url_object_result = answerService.isStringArrayType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
    });
  });

  describe('isURLObjectType', () => {
    it('should return false for string', async () => {
      const string_response: IAnswerResponse = {
        name: 'name',
        value: 'some string',
      };
      const string_result = answerService.isURLObjectType(
        string_response.value,
      );
      expect(string_result).toBe(false);
    });

    it('should return false for a string array', async () => {
      const string_array_response: IAnswerResponse = {
        name: 'name',
        value: ['some string', 'some other string'],
      };
      const string_array_result = answerService.isURLObjectType(
        string_array_response.value,
      );
      expect(string_array_result).toBe(false);
    });

    it('should return false for url array', async () => {
      const url_array_response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: 'some string', isPublic: false },
          { url: 'some other string', isPublic: false },
        ],
      };
      const url_array_result = answerService.isURLObjectType(
        url_array_response.value,
      );
      expect(url_array_result).toBe(false);
    });

    it('should return true for url object', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: { url: 'some string', isPublic: false },
      };
      const url_object_result = answerService.isURLObjectType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(true);
    });

    it('should return false for undefined', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
      };
      const url_object_result = answerService.isURLObjectType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
    });
  });

  describe('isUrlArrayType', () => {
    it('should return false for string', async () => {
      const string_response: IAnswerResponse = {
        name: 'name',
        value: 'some string',
      };
      const string_result = answerService.isUrlArrayType(string_response.value);
      expect(string_result).toBe(false);
    });

    it('should return false for a string array', async () => {
      const string_array_response: IAnswerResponse = {
        name: 'name',
        value: ['some string', 'some other string'],
      };
      const string_array_result = answerService.isUrlArrayType(
        string_array_response.value,
      );
      expect(string_array_result).toBe(false);
    });

    it('should return true for url array', async () => {
      const url_array_response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: 'some string', isPublic: false },
          { url: 'some other string', isPublic: false },
        ],
      };
      const url_array_result = answerService.isUrlArrayType(
        url_array_response.value,
      );
      expect(url_array_result).toBe(true);
    });

    it('should return false for url object', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
        value: { url: 'some string', isPublic: false },
      };
      const url_object_result = answerService.isUrlArrayType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
    });

    it('should return false for undefined', async () => {
      const url_object_response: IAnswerResponse = {
        name: 'name',
      };
      const url_object_result = answerService.isUrlArrayType(
        url_object_response.value,
      );
      expect(url_object_result).toBe(false);
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

  describe('updateResponse', () => {
    it('should update the permissions for a file in a response', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'updateFile')
        .mockResolvedValue(undefined);
      const url1 = faker.internet.url();
      const response: IAnswerResponse = {
        name: 'name',
        value: { url: url1, isPublic: false },
      };

      const result = await answerService.updateResponse({
        response,
        privateFiles: [],
        publicFiles: [url1],
      });

      expect(result).toMatchObject({
        value: { url: url1, isPublic: true },
      });
      expect(s3Spy).toHaveBeenCalledTimes(1);
    });

    it('should update the permissions for multiple files in a response', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'updateFile')
        .mockResolvedValue(undefined);
      const url1 = faker.internet.url();
      const url2 = faker.internet.url();
      const url3 = faker.internet.url();
      const response: IAnswerResponse = {
        name: 'name',
        value: [
          { url: url1, isPublic: false },
          { url: url2, isPublic: true },
          { url: url3, isPublic: true },
        ],
      };

      const result = await answerService.updateResponse({
        response,
        privateFiles: [url2],
        publicFiles: [url1],
      });

      expect(result).toMatchObject({
        value: [
          { url: url1, isPublic: true },
          { url: url2, isPublic: false },
          { url: url3, isPublic: true },
        ],
      });
      expect(s3Spy).toHaveBeenCalledTimes(2);
    });

    it('should leave string responses alone', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'updateFile')
        .mockResolvedValue(undefined);
      const url1 = faker.internet.url();
      const response: IAnswerResponse = {
        name: 'name',
        value: url1,
      };

      const result = await answerService.updateResponse({
        response,
        privateFiles: [],
        publicFiles: [url1],
      });

      expect(result).toMatchObject({
        value: url1,
      });
      expect(s3Spy).toHaveBeenCalledTimes(0);
    });

    it('should leave string array responses alone', async () => {
      const s3Spy = jest
        .spyOn(s3Service, 'updateFile')
        .mockResolvedValue(undefined);
      const url1 = faker.internet.url();
      const url2 = faker.internet.url();
      const response: IAnswerResponse = {
        name: 'name',
        value: [url1, url2],
      };

      const result = await answerService.updateResponse({
        response,
        privateFiles: [],
        publicFiles: [url1],
      });

      expect(result).toMatchObject({
        value: [url1, url2],
      });
      expect(s3Spy).toHaveBeenCalledTimes(0);
    });
  });
});
