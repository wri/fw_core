// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserService } from '../common/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import ROLES from '../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../common/database/database.service';
import { TeamsService } from '../teams/services/teams.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { TemplateAreaRelationService } from '../areas/services/templateAreaRelation.service';
import { TemplatesService } from '../templates/templates.service';
import { AnswersService } from '../answers/services/answers.service';
import { Answer } from '../answers/models/answer.model';
import constants from '../answers/tests/templates.constants';
import { S3Service } from '../answers/services/s3Service';
import { TeamAreaRelationService } from '../areas/services/teamAreaRelation.service';
import { AreasService } from '../areas/services/areas.service';
import { GeostoreService } from '../areas/services/geostore.service';
import { CoverageService } from '../areas/services/coverage.service';
import { DatasetService } from '../areas/services/dataset.service';
import { ConfigService } from '@nestjs/config';

describe('Answers', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (_id) => 'Full Name',
  };
  const s3Service = {
    uploadFile: (_file, _name, _isPublic) =>
      `https://s3.amazonaws.com/bucket/folder/uuid.ext`,
    generatePresignedUrl: (_input: { key: 'some key' }) =>
      'https://s3.amazonaws.com/bucket/folder/presigned.ext',
    updateFile: (_file, _name, _isPublic) => undefined,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        UserService,
        DatabaseService,
        TeamsService,
        TeamMembersService,
        TemplatesService,
        TemplateAreaRelationService,
        TeamAreaRelationService,
        AnswersService,
        AreasService,
        GeostoreService,
        CoverageService,
        DatasetService,
        { provide: S3Service, useValue: jest.fn() },
        { provide: getModelToken('gfwteams', 'teamsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('teamuserrelations', 'teamsDb'),
          useValue: jest.fn(),
        },
        { provide: getModelToken('reports', 'formsDb'), useValue: jest.fn() },
        { provide: getModelToken(Answer.name, 'formsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('areatemplaterelations', 'apiDb'),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken('areateamrelations', 'apiDb'),
          useValue: jest.fn(),
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => key,
          },
        },
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .overrideProvider(S3Service)
      .useValue(s3Service)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    teamsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getTeamsHandle();
    apiDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getApiHandle();
    formsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getFormsHandle();
  });

  describe('GET /templates/:templateId/answers', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return an array all user answers', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
        createdAt: '2024-06-05T12:46:08.810Z',
      });
      await formsDbConnection.collection('answers').insertOne({
        report: new mongoose.Types.ObjectId(),
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
        createdAt: '2024-06-04T12:46:08.810Z',
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
        createdAt: '2024-05-05T12:46:08.810Z',
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 2',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
        createdAt: '2023-06-05T12:46:08.810Z',
      });
      const response = await request(app.getHttpServer())
        .get(`/statistics/reports`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBeInstanceOf('string');

      const data = await request(app.getHttpServer())
        .get(`/statistics/results/${response.body.data.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(data.body.data).toMatchObject([
        {
          year: '2024',
          count: 3,
          months: [
            { month: 'June', count: 2 },
            { month: 'May', count: 1 },
          ],
        },
        {
          year: '2023',
          count: 1,
          months: [{ month: 'June', count: 1 }],
        },
      ]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
