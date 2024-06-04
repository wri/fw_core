// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest';
import assignments from '../../assignments/tests/assignments.constants';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserService } from '../../common/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
import {
  EMemberRole,
  EMemberStatus,
} from '../../teams/models/teamMember.schema';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { TemplateAreaRelationService } from '../../areas/services/templateAreaRelation.service';
import { TemplatesService } from '../../templates/templates.service';
import { AnswersService } from '../services/answers.service';
import { Answer } from '../models/answer.model';
import constants from './templates.constants';
import asssignments from '../../assignments/tests/assignments.constants';
import { S3Service } from '../services/s3Service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { AssignmentStatus } from '../../assignments/assignment-status.enum';
import { CreateAnswerDto } from '../dto/create-answer.dto';
import { AreasService } from '../../areas/services/areas.service';
import { GeostoreService } from '../../areas/services/geostore.service';
import { CoverageService } from '../../areas/services/coverage.service';
import { DatasetService } from '../../areas/services/dataset.service';

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

  describe('Permissions Middleware', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 404 if the template doesnt exist', async () => {
      const id = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .get(`/templates/${id.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should succeed if the user owns the template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(200);
    });

    it('should fail if the user doesnt own the template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.managerTemplate);
      await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should succeed if the template is public', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(200);
    });

    it('should succeed if the template is owned by a team manager', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.managerTemplate);
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(200);
    });
  });

  describe('GET /templates/:templateId/answers', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/${2}/answers`)
        .expect(401);
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
      });
      await formsDbConnection.collection('answers').insertOne({
        report: new mongoose.Types.ObjectId(),
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const userAnswer2 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 2',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty(
        'reportName',
        'answer 1',
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        userAnswer2.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty('attributes');
      expect(response.body.data[1].attributes).toHaveProperty(
        'reportName',
        'answer 2',
      );
    });

    it('should return all monitor answers for managers', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const managerAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      await formsDbConnection.collection('answers').insertOne({
        report: new mongoose.Types.ObjectId(),
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const userAnswer2 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 2',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        managerAnswer.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data[2]).toHaveProperty(
        'id',
        userAnswer2.insertedId.toString(),
      );
    });

    it('should return all answers for template creator', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });
      const managerAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      await formsDbConnection.collection('answers').insertOne({
        report: new mongoose.Types.ObjectId(),
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const userAnswer2 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 2',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        managerAnswer.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data[2]).toHaveProperty(
        'id',
        userAnswer2.insertedId.toString(),
      );
    });

    it('should return answer objects that contain full name of creator', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: new mongoose.Types.ObjectId(),
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 2',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const response = await request(app.getHttpServer())
        .get(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty(
        'fullName',
        'Full Name',
      );
    });
  });

  describe('GET /templates/:templateId/answers/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/${2}/answers/${1}`)
        .expect(401);
    });

    it('should return a users answer', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'report',
        template.insertedId.toString(),
      );
      expect(response.body.data.attributes).toHaveProperty(
        'reportName',
        'answer 1',
      );
    });

    it('should generate a presigned URL', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [
            { name: 'question-1', value: { url: 'some url', isPublic: false } },
          ],
        });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'report',
        template.insertedId.toString(),
      );
      expect(response.body.data.attributes).toHaveProperty(
        'reportName',
        'answer 1',
      );
      expect(response.body.data.attributes.responses[0].value).toMatchObject({
        url: 'https://s3.amazonaws.com/bucket/folder/presigned.ext',
        isPublic: false,
      });
    });

    it('should return an answer containing the creators full name', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'fullName',
        'Full Name',
      );
    });

    it('should return another users answer if the current user owns the template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'report',
        template.insertedId.toString(),
      );
      expect(response.body.data.attributes).toHaveProperty(
        'reportName',
        'answer 1',
      );
    });

    it('should fail to return another users answer if the current user doesnt own the template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(404);

      expect(response.body).toHaveProperty(
        'message',
        'No answer found with your permissions',
      );
    });

    it('should return another users answer if they are in a team with current user', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        userAnswer1.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'report',
        template.insertedId.toString(),
      );
      expect(response.body.data.attributes).toHaveProperty(
        'reportName',
        'answer 1',
      );
    });

    it('should return assignmentId on answer response', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });

      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
          assignmentId: assignment.insertedId,
        });

      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data.attributes.assignmentId).toBe(
        assignment.insertedId.toString(),
      );
    });
  });

  describe('POST /templates/:templateId/answers', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .post(`/templates/${2}/answers`)
        .expect(401);
    });

    it('should create an answer', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      await request(app.getHttpServer())
        .post(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .send({
          reportName: 'name',
          language: 'en',
          'question-1': 'answer',
          clickedPosition:
            '[{"lat": -3.875649929046631,"lon": -64.98695373535156}]',
        })
        .expect(201);

      const answer = await formsDbConnection
        .collection('answers')
        .findOne({ report: template.insertedId });
      expect(answer).toBeDefined();
      expect(answer).toHaveProperty('reportName', 'name');
      expect(answer).toHaveProperty('responses');
      expect(answer?.responses[0]).toHaveProperty('name', 'question-1');
      expect(answer?.responses[0]).toHaveProperty('value', 'answer');
    });

    it('should return the created answer', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const response = await request(app.getHttpServer())
        .post(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .send({
          reportName: 'name',
          language: 'en',
          'question-1': 'answer',
          clickedPosition:
            '[{"lat": -3.875649929046631,"lon": -64.98695373535156}]',
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('responses');
      expect(response.body.data.attributes.responses[0]).toHaveProperty(
        'name',
        'question-1',
      );
      expect(response.body.data.attributes.responses[0]).toHaveProperty(
        'value',
        'answer',
      );
    });

    it('should save an image', async () => {
      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.defaultTemplate,
        questions: [
          {
            type: 'blob',
            name: 'question-1',
            conditions: [],
            childQuestions: [],
            order: 0,
            required: false,
            label: {
              en: 'test',
            },
          },
        ],
      });
      const response = await request(app.getHttpServer())
        .post(`/templates/${template.insertedId.toString()}/answers`)
        .set('Authorization', 'USER')
        .attach('question-1', fileData, filename)
        .field({
          reportName: 'name',
          language: 'en',
          clickedPosition:
            '[{"lat": -3.875649929046631,"lon": -64.98695373535156}]',
        })
        .expect(201);

      const answerResponses = response.body.data.attributes.responses;
      expect(answerResponses).toHaveLength(1);
      const firstAnswerResponse = answerResponses[0];
      expect(firstAnswerResponse.name).toBe('question-1');
      expect(firstAnswerResponse.value).toBeInstanceOf(Object);
      expect(firstAnswerResponse.value).toMatchObject({
        url: 'https://s3.amazonaws.com/bucket/folder/presigned.ext',
      });
    });

    it('should return a 401 if submitting an assignment the user is not a monitor on', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });

      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...asssignments.defaultAssignment,
          monitors: [new mongoose.Types.ObjectId()],
          status: AssignmentStatus.OPEN,
          templateIds: [template.insertedId.toString()],
          createdBy: new mongoose.Types.ObjectId(),
          name: 'Assignment',
        });

      await request(app.getHttpServer())
        .post(`/templates/${template.insertedId}/answers`)
        .set('authorization', 'USER')
        .send({
          language: 'en',
          reportName: 'Report Name',
          assignmentId: assignment.insertedId.toString(),
        } as CreateAnswerDto)
        .expect(401);

      const assignmentDb = await formsDbConnection
        .collection('assignments')
        .findOne({ _id: assignment.insertedId });

      expect(assignmentDb?.status).toEqual(AssignmentStatus.OPEN);
    });

    it('should return a 400 if submitting an assignment on the wrong template', async () => {
      const templates = await formsDbConnection
        .collection('reports')
        .insertMany([
          { ...constants.userTemplate, _id: new mongoose.Types.ObjectId() },
          { ...constants.userTemplate, _id: new mongoose.Types.ObjectId() },
        ]);

      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...asssignments.defaultAssignment,
          monitors: [ROLES.USER.id],
          status: AssignmentStatus.OPEN,
          templateIds: [templates.insertedIds[0].toString()],
          createdBy: new mongoose.Types.ObjectId(),
          name: 'Assignment',
        });

      await request(app.getHttpServer())
        .post(`/templates/${templates.insertedIds[1]}/answers`)
        .set('authorization', 'USER')
        .send({
          language: 'en',
          reportName: 'Report Name',
          assignmentId: assignment.insertedId.toString(),
        } as CreateAnswerDto)
        .expect(400);

      const assignmentDb = await formsDbConnection
        .collection('assignments')
        .findOne({ _id: assignment.insertedId });

      expect(assignmentDb?.status).toEqual(AssignmentStatus.OPEN);
    });

    it('should change assignment to completed if answer is with assignmentId', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate });

      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...asssignments.defaultAssignment,
          monitors: [ROLES.USER.id],
          status: AssignmentStatus.OPEN,
          templateIds: [template.insertedId.toString()],
          createdBy: new mongoose.Types.ObjectId(),
          name: 'Assignment',
        });

      await request(app.getHttpServer())
        .post(`/templates/${template.insertedId}/answers`)
        .set('authorization', 'USER')
        .send({
          language: 'en',
          reportName: 'Report Name',
          assignmentId: assignment.insertedId.toString(),
        } as CreateAnswerDto)
        .expect(201);

      const assignmentDb = await formsDbConnection
        .collection('assignments')
        .findOne({ _id: assignment.insertedId });

      expect(assignmentDb?.status).toEqual(AssignmentStatus.COMPLETED);
    });
  });

  describe('DELETE /templates/:templateId/answers/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/templates/${2}/answers/${1}`)
        .expect(401);
    });

    it('should delete a users answer', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const insertedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(insertedAnswer?._id).toBeDefined();
      await request(app.getHttpServer())
        .delete(
          `/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      const deletedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(deletedAnswer).toBeNull();
    });

    it('should fail to delete someone elses answer', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const insertedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(insertedAnswer?._id).toBeDefined();
      await request(app.getHttpServer())
        .delete(
          `/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`,
        )
        .set('Authorization', 'MANAGER')
        .expect(403);

      const deletedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(deletedAnswer?._id).toBeDefined();
    });

    it('should delete answer in team area if user is team manager', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        teamId: team.insertedId.toString(),
        areaId: areaId.toString(),
      });
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        areaOfInterest: areaId,
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const insertedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(insertedAnswer?._id).toBeDefined();
      await request(app.getHttpServer())
        .delete(
          `/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`,
        )
        .set('Authorization', 'MANAGER')
        .expect(200);

      const deletedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(deletedAnswer).toBeNull();
    });

    it('should fail to delete answer in team area if user is team monitor', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: ROLES.MANAGER.id,
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        teamId: team.insertedId.toString(),
        areaId: areaId.toString(),
      });
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        areaOfInterest: areaId,
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const insertedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(insertedAnswer?._id).toBeDefined();
      await request(app.getHttpServer())
        .delete(
          `/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`,
        )
        .set('Authorization', 'MANAGER')
        .expect(403);

      const deletedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer.insertedId });
      expect(deletedAnswer?._id).toBeDefined();
    });
  });

  describe('GET /templates/:templateId/answers/areas/:areaId', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/${2}/answers/areas/${1}`)
        .expect(401);
    });

    it('should return users answers related to an area', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        areaOfInterest: areaId,
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/areas/${areaId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        answer.insertedId.toString(),
      );
    });

    it('should return answers containing the creators full name', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        areaOfInterest: areaId,
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/areas/${areaId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty(
        'fullName',
        'Full Name',
      );
    });
    it('should not return other users answers related to an area', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        areaOfInterest: areaId,
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/areas/${areaId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(0);
    });

    it('should return other users answers related to an area if on the same team', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.defaultTemplate);
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        teamId: team.insertedId.toString(),
        areaId: areaId.toString(),
      });
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        areaOfInterest: areaId,
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const response = await request(app.getHttpServer())
        .get(
          `/templates/${template.insertedId.toString()}/answers/areas/${areaId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        answer.insertedId.toString(),
      );
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
