// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest';
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
import { TemplatesService } from '../templates.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import constants from './templates.constants';
import areaConstants from '../../areas/test/area.constants';
import { TemplateAreaRelationService } from '../../areas/services/templateAreaRelation.service';
import { ETemplateStatus, TemplateDocument } from '../models/template.schema';
import { MongooseObjectId } from '../../common/objectId';
import { AreasModule } from '../../areas/modules/areas.module';
import { AreasService } from '../../areas/services/areas.service';
import { CreateTemplateInput } from '../input/create-template.input';
//import { IArea } from '../../areas/models/area.entity';

describe('Templates', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  const userService = {
    authorise: jest.fn((token) => ROLES[token]),
    getNameByIdMICROSERVICE: jest.fn((_id) => 'Full Name'),
  };
  const areaService = {
    getAreaMICROSERVICE: jest.fn((_id) => {
      if (_id.toString() === areaConstants.testArea.id)
        return areaConstants.testArea;
      else if (_id.toString() === areaConstants.testTeamArea.id)
        return areaConstants.testTeamArea;
      else return null;
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, AreasModule],
      providers: [
        UserService,
        DatabaseService,
        TeamsService,
        TeamMembersService,
        TemplatesService,
        TemplateAreaRelationService,
        { provide: getModelToken('gfwteams', 'teamsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('teamuserrelations', 'teamsDb'),
          useValue: jest.fn(),
        },
        { provide: getModelToken('reports', 'formsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('areatemplaterelations', 'apiDb'),
          useValue: jest.fn(),
        },
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .overrideProvider(AreasService)
      .useValue(areaService)
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

  describe('POST /templates', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection
        .collection('areatemplaterelations')
        .deleteMany({});
      jest.clearAllMocks();
    });

    const createTemplateInput: Partial<CreateTemplateInput> = {
      defaultLanguage: 'en',
      languages: ['en'],
      name: { en: 'template' },
      public: false,
      questions: [
        {
          type: 'text',
          name: 'question-name',
          label: { en: 'question' },
        },
      ],
      status: ETemplateStatus.PUBLISHED,
    };

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).post(`/templates`).expect(401);
    });

    it('should fail if no name supplied', async () => {
      const body = { ...createTemplateInput };
      delete body.name;
      const response = await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);

      expect(response.body.message).toContainEqual(
        'name should not be null or undefined',
      );
    });

    it('should fail if no questions supplied', async () => {
      const body = { ...createTemplateInput };
      delete body.questions;
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);
    });

    it('should fail if no languages supplied', async () => {
      const body = { ...createTemplateInput };
      delete body.languages;
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);
    });

    it('should fail if no status supplied', async () => {
      const body = { ...createTemplateInput };
      delete body.status;
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);
    });

    it('should fail if wrong status supplied', async () => {
      const body = { ...createTemplateInput, status: 'WRONG' };
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);
    });

    it('should fail if report name doesnt match languages', async () => {
      const body = { ...createTemplateInput, name: { fr: 'template' } };
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);
    });

    it('should fail if question label doesnt match languages', async () => {
      const body = {
        ...createTemplateInput,
        questions: [
          { type: 'text', name: 'question-name', label: { fr: 'question' } },
        ],
      };
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(400);
    });

    it('should succeed with a 201', async () => {
      const body = { ...createTemplateInput };
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(201);
    });

    it('should return the saved template', async () => {
      const body = { ...createTemplateInput };
      const response = await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name');
      expect(response.body.data.attributes.name).toHaveProperty(
        'en',
        'template',
      );
    });

    it('should create a template', async () => {
      const body = { ...createTemplateInput };
      const responseCreate = await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(201);

      const responseGet = await request(app.getHttpServer())
        .get(`/templates/${responseCreate.body.data.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(responseGet.body.data.id).toBe(responseCreate.body.data.id);
      expect(responseGet.body.data.attributes).toMatchObject({
        status: ETemplateStatus.PUBLISHED,
        name: { en: 'template' },
        languages: ['en'],
        defaultLanguage: 'en',
        public: false,
        questions: [
          { type: 'text', name: 'question-name', label: { en: 'question' } },
        ],
      });
    });

    it('should fail to create a public template if not ADMIN', async () => {
      const body = { ...createTemplateInput, public: true };
      await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(403);
    });

    it('should create a public template if ADMIN', async () => {
      const body = { ...createTemplateInput, public: true };
      const responseCreate = await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'ADMIN')
        .send(body)
        .expect(201);

      const responseGet = await request(app.getHttpServer())
        .get(`/templates/${responseCreate.body.data.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(responseGet.body.data.attributes.public).toBe(true);
    });

    it('should add area relations', async () => {
      jest
        .spyOn(areaService, 'getAreaMICROSERVICE')
        .mockImplementation(
          (id) => ({ id, attributes: { name: 'SOME NAME' } } as any),
        );

      const body = {
        ...createTemplateInput,
        areaIds: [new MongooseObjectId(), new MongooseObjectId()].map((id) =>
          id.toString(),
        ),
      };
      const response = await request(app.getHttpServer())
        .post(`/templates`)
        .set('Authorization', 'USER')
        .send(body)
        .expect(201);

      const relationCount = await apiDbConnection
        .collection('areatemplaterelations')
        .countDocuments({
          templateId: response.body.data.id,
        });

      expect(relationCount).toBe(2);
    });
  });

  describe('GET /templates', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).get(`/templates`).expect(401);
    });

    it('should return an array of templates', async () => {
      const response = await request(app.getHttpServer())
        .get(`/templates`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return the default template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const response = await request(app.getHttpServer())
        .get(`/templates`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        template.insertedId.toString(),
      );
    });

    it('should return the default template and users templates', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      await formsDbConnection
        .collection('reports')
        .insertOne(constants.managerTemplate);
      const template3 = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const response = await request(app.getHttpServer())
        .get(`/templates`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        template.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        template3.insertedId.toString(),
      );
    });
  });

  describe('GET /templates/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/${1}`)
        .expect(401);
    });

    it('should return a template', async () => {
      const template3 = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const response = await request(app.getHttpServer())
        .get(`/templates/${template3.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        template3.insertedId.toString(),
      );
    });

    it('should return a template with user answers count for user', async () => {
      const template3 = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });

      const response = await request(app.getHttpServer())
        .get(`/templates/${template3.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        template3.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 1);
    });

    it('should return a template with every answers count for template creator', async () => {
      const template3 = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });

      const response = await request(app.getHttpServer())
        .get(`/templates/${template3.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        template3.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 2);
    });

    it('should return a template with every answers count for admin', async () => {
      const template3 = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });

      const response = await request(app.getHttpServer())
        .get(`/templates/${template3.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        template3.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 2);
    });
  });

  describe('GET /templates/allAnswers', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/allAnswers`)
        .expect(401);
    });

    it('should return all user answers and team answers of teams user manages that are within team areas', async () => {
      const defaultTemplate = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const managerTemplate = await formsDbConnection
        .collection('reports')
        .insertOne(constants.managerTemplate);
      const userTemplate = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);

      const teamAreaId = new mongoose.Types.ObjectId();

      const managerAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: managerTemplate.insertedId,
          reportName: 'manager answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const managerAnswer2 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: defaultTemplate.insertedId,
          reportName: 'manager answer 2',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      await formsDbConnection.collection('answers').insertOne({
        report: userTemplate.insertedId,
        reportName: 'admin answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.ADMIN.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: userTemplate.insertedId,
        reportName: 'user answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const userAnswer2 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: defaultTemplate.insertedId,
          reportName: 'user answer 2',
          areaOfInterest: new mongoose.Types.ObjectId(teamAreaId),
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });

      const team1 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team1.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        role: EMemberRole.Monitor,
        status: EMemberStatus.Confirmed,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team1.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: ROLES.MANAGER.email,
        role: EMemberRole.Manager,
        status: EMemberStatus.Confirmed,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        teamId: team1.insertedId.toString(),
        areaId: teamAreaId.toString(),
      });

      const response = await request(app.getHttpServer())
        .get(`/templates/allAnswers`)
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(4);
      const ids = response.body.data.map((answer) => answer.id);
      expect(ids).toContain(managerAnswer.insertedId.toString());
      expect(ids).toContain(managerAnswer2.insertedId.toString());
      expect(ids).toContain(userAnswer2.insertedId.toString());
    });
  });

  describe('DELETE /templates/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/templates/${2}`)
        .expect(401);
    });

    it('should delete an unpublished template without answers', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.userTemplate,
        status: 'unpublished',
      });
      const createdTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(createdTemplate).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      const deletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(deletedTemplate).toBeNull();
    });

    it('should fail to delete a published template without answers', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const createdTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(createdTemplate).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should fail to delete an upublished template with answers', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.userTemplate,
        status: 'unpublished',
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const createdTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(createdTemplate).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    /* it('should succeed to delete an published template with answers and all answers if the user is ADMIN', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const userAnswer1 = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: template.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const createdTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(createdTemplate).toBeDefined();
      const createdAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: userAnswer1.insertedId });
      expect(createdAnswer).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .expect(200);

      const deletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(deletedTemplate).toBeNull();
      const deletedAnswer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: userAnswer1.insertedId });
      expect(deletedAnswer).toBeNull();
    }); */

    it('should delete template area relations', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.userTemplate,
        status: 'unpublished',
      });
      const relation = await apiDbConnection
        .collection('areatemplaterelations')
        .insertOne({
          templateId: template.insertedId.toString(),
          areaId: new mongoose.Types.ObjectId(),
        });
      const createdTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(createdTemplate).toBeDefined();
      const createdRelation = await apiDbConnection
        .collection('areatemplaterelations')
        .findOne({ _id: relation.insertedId });
      expect(createdRelation).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      const deletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(deletedTemplate).toBeNull();
      const deletedRelation = await apiDbConnection
        .collection('areatemplaterelations')
        .findOne({ _id: relation.insertedId });
      expect(deletedRelation).toBeNull();
    });
  });

  describe('PATCH /templates/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      jest.clearAllMocks();
    });

    const createTemplateInput: Partial<CreateTemplateInput> = {
      defaultLanguage: 'en',
      languages: ['en'],
      name: { en: 'template' },
      public: false,
      questions: [
        {
          type: 'text',
          name: 'question-name',
          label: { en: 'question' },
        },
      ],
      status: ETemplateStatus.PUBLISHED,
    };

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .patch(`/templates/${2}`)
        .expect(401);
    });

    it('should fail if no template found', async () => {
      return await request(app.getHttpServer())
        .patch(`/templates/${new MongooseObjectId()}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'NAME' } })
        .expect(403);
    });

    it('should fail in changing a different users template', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.userTemplate,
        user: new MongooseObjectId().toString(),
      });
      return await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'NAME' } })
        .expect(403);
    });

    it('should create a new version on update', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate, {});

      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'CHANGED NAME' } })
        .expect(200);

      const updatedTemplateDb = await formsDbConnection
        .collection('reports')
        .findOne<TemplateDocument>({
          _id: new MongooseObjectId(response.body.data.id),
        });

      expect(updatedTemplateDb).not.toBeNull();
      expect(updatedTemplateDb).toMatchObject({
        name: { en: 'CHANGED NAME' },
        editGroupId: constants.userTemplate.editGroupId,
      });
    });

    it('should change values on new version', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate, {});

      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}`)
        .set('Authorization', 'USER')
        .send({
          name: { fr: 'French name' },
          languages: ['fr'],
          defaultLanguage: 'fr',
          questions: [
            {
              type: 'text',
              label: { fr: 'French label' },
              name: 'FRENCH QUESTION',
              required: false,
            },
          ],
        })
        .expect(200);

      const updatedTemplateDb = await formsDbConnection
        .collection('reports')
        .findOne<TemplateDocument>({
          _id: new MongooseObjectId(response.body.data.id),
        });

      expect(updatedTemplateDb).toBeDefined();
      expect(updatedTemplateDb).toMatchObject({
        name: { fr: 'French name' },
        languages: ['fr'],
        defaultLanguage: 'fr',
        questions: [
          {
            type: 'text',
            label: { fr: 'French label' },
            name: 'FRENCH QUESTION',
            required: false,
          },
        ],
      });
    });

    it('should change the latest template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate, {});

      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'CHANGED NAME' } })
        .expect(200);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne<TemplateDocument>({
          _id: template.insertedId,
        });

      const updatedTemplateDb = await formsDbConnection
        .collection('reports')
        .findOne<TemplateDocument>({
          _id: new MongooseObjectId(response.body.data.id),
        });

      expect(updatedTemplateDb).not.toBeNull();
      expect(updatedTemplateDb).toMatchObject({
        editGroupId: new MongooseObjectId(templateDb?.editGroupId),
        isLatest: true,
      });
      expect(templateDb).not.toBeNull();
      expect(templateDb).toMatchObject({
        isLatest: false,
      });
    });

    it('should return the template', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'CHANGED NAME' } })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', {
        en: 'CHANGED NAME',
      });
    });

    it('should return a template with every answers count', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'CHANGED NAME' } })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 1);
    });

    it('should add area relations', async () => {
      jest
        .spyOn(areaService, 'getAreaMICROSERVICE')
        .mockImplementation(
          (id) => ({ id, attributes: { name: 'SOME NAME' } } as any),
        );
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate }, {});

      const areaIds = [new MongooseObjectId(), new MongooseObjectId()].map(
        (id) => id.toString(),
      );

      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}`)
        .set('Authorization', 'USER')
        .send({ areaIds })
        .expect(200);

      const relationCursor = apiDbConnection
        .collection('areatemplaterelations')
        .find({ templateId: response.body.data.id });

      await expect(relationCursor.count()).resolves.toBe(2);
      await expect(
        relationCursor.filter({ areaId: areaIds[0] }).count(),
      ).resolves.toBe(1);
      await expect(
        relationCursor.filter({ areaId: areaIds[1] }).count(),
      ).resolves.toBe(1);
    });

    it('should persist old area relations if no area Ids given', async () => {
      jest
        .spyOn(areaService, 'getAreaMICROSERVICE')
        .mockImplementation(
          (id) => ({ id, attributes: { name: 'SOME NAME' } } as any),
        );

      const areaIds = [new MongooseObjectId(), new MongooseObjectId()].map(
        (id) => id.toString(),
      );
      const createBody: CreateTemplateInput = {
        defaultLanguage: 'en',
        languages: ['en'],
        name: { en: 'My template' },
        questions: [
          { label: { en: 'My question' }, name: 'question-1', type: 'text' },
        ],
        status: ETemplateStatus.UNPUBLISHED,
        areaIds,
      };
      const template = await request(app.getHttpServer())
        .post('/templates')
        .set('Authorization', 'USER')
        .send(createBody);

      const response = await request(app.getHttpServer())
        .patch(`/templates/${template.body.data.id}`)
        .set('Authorization', 'USER')
        .send({ name: { en: 'SOMENAME' } })
        .expect(200);

      const relationCursor = apiDbConnection
        .collection('areatemplaterelations')
        .find({ templateId: response.body.data.id });

      await expect(relationCursor.count()).resolves.toBe(2);

      const areaIdsDb = (await relationCursor.toArray()).map((r) => r.areaId);
      expect(areaIdsDb.sort()).toEqual(areaIds.sort());
    });
  });

  describe('DELETE /templates/allUser/:userId', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/templates/allUser/1`)
        .expect(401);
    });

    it('should delete all a users answers for all templates', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const template2 = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const answer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const answer2 = await formsDbConnection.collection('answers').insertOne({
        report: template2.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const answer3 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.ADMIN.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      const createdAnswer1 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer1.insertedId });
      expect(createdAnswer1).toBeDefined();
      const createdAnswer2 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer2.insertedId });
      expect(createdAnswer2).toBeDefined();
      const createdAnswer3 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer3.insertedId });
      expect(createdAnswer3).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/templates/allUser/${ROLES.USER.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      const deletedAnswer1 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer1.insertedId });
      expect(deletedAnswer1).toBeNull();
      const deletedAnswer2 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer2.insertedId });
      expect(deletedAnswer2).toBeNull();
      const deletedAnswer3 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: answer3.insertedId });
      expect(deletedAnswer3).not.toBeNull();
    });

    it('should delete all a users templates', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const template2 = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });

      await request(app.getHttpServer())
        .delete(`/templates/allUser/${ROLES.USER.id}`)
        .set('Authorization', 'USER')
        .expect(200);
      const deletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(deletedTemplate).toBeNull();
      const nonDeletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template2.insertedId });
      expect(nonDeletedTemplate).not.toBeNull();
    });

    it('shouldnt delete a template with answers', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const template2 = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.ADMIN.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });

      await request(app.getHttpServer())
        .delete(`/templates/allUser/${ROLES.USER.id}`)
        .set('Authorization', 'USER')
        .expect(200);
      const deletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });
      expect(deletedTemplate).not.toBeNull();
      const nonDeletedTemplate = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template2.insertedId });
      expect(nonDeletedTemplate).not.toBeNull();
    });

    it('should return arrays of details', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne(constants.userTemplate);
      const template2 = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.ADMIN.id),
        responses: [{ name: 'question-1', value: 'test' }],
      });

      const response = await request(app.getHttpServer())
        .delete(`/templates/allUser/${ROLES.USER.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('deletedAnswers');
      expect(response.body.deletedAnswers[0]).toBe(
        answer.insertedId.toString(),
      );
      expect(response.body).toHaveProperty('undeletedTemplates');
      expect(response.body.undeletedTemplates[0]).toBe(
        template.insertedId.toString(),
      );
    });
  });

  describe('GET /templates/latest', () => {
    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/latest`)
        .expect(401);
    });

    it('should return empty array if no templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates/latest')
        .set('Authorization', 'USER')
        .expect(200);

      expect(response).toBeDefined();
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return only the latest templates of the user', async () => {
      const collection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId1 = new mongoose.Types.ObjectId();
      const groupId2 = new mongoose.Types.ObjectId();
      const groupId3 = new mongoose.Types.ObjectId();
      const templates = await collection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId1,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId1,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId2,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId3,
          isLatest: true,
          user: new mongoose.Types.ObjectId(),
        },
      ]);

      const latestTemplateIds = [
        templates.insertedIds[0],
        templates.insertedIds[2],
      ].map((t) => t.toString());

      const response = await request(app.getHttpServer())
        .get('/templates/latest')
        .set('Authorization', 'USER')
        .expect(200);

      const data = response?.body?.data;
      expect(data).toBeDefined();
      expect(data).toBeInstanceOf(Array);
      expect(data).toHaveLength(2);

      const dataIds = data.map((d) => d.id);
      expect(dataIds.sort()).toEqual(latestTemplateIds.sort());
    });

    it('should return answer count for all versions for each template', async () => {
      const templateCollection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId1 = new mongoose.Types.ObjectId();
      const groupId2 = new mongoose.Types.ObjectId();
      const groupId3 = new mongoose.Types.ObjectId();
      const templates = await templateCollection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId1,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId1,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId2,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId3,
          isLatest: true,
        },
      ]);

      const answerBolierplate = {
        report: undefined,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
      };
      await formsDbConnection.collection('answers').insertMany([
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[1] },
        { ...answerBolierplate, report: templates.insertedIds[2] },
      ]);

      const response = await request(app.getHttpServer())
        .get('/templates/latest')
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      const answerCounts = {
        [groupId1.toString()]: 2,
        [groupId2.toString()]: 1,
        [groupId3.toString()]: 0,
      };
      response.body.data.forEach((t) => {
        const responseCount = t.attributes.answersCount;
        const expectedCount = answerCounts[t.attributes.editGroupId];
        expect(responseCount).toBe(expectedCount);
      });
    });

    it('should return templates missing the isLatest flag', async () => {
      const collection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId1 = new mongoose.Types.ObjectId();
      const groupId2 = new mongoose.Types.ObjectId();
      const templates = await collection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId1,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId1,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId2,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
        },
      ]);

      const latestTemplateIds = [
        templates.insertedIds[0],
        templates.insertedIds[2],
        templates.insertedIds[3],
      ].map((t) => t.toString());

      const response = await request(app.getHttpServer())
        .get('/templates/latest')
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data).toContainEqual(
        expect.objectContaining({ id: latestTemplateIds[0] }),
      );
      expect(response.body.data).toContainEqual(
        expect.objectContaining({ id: latestTemplateIds[1] }),
      );
      expect(response.body.data).toContainEqual(
        expect.objectContaining({ id: latestTemplateIds[2] }),
      );
    });
  });

  describe('GET /templates/versions/:id', () => {
    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return 401 if not logged in', async () => {
      return await request(app.getHttpServer())
        .get(`/templates/versions/fakeid`)
        .expect(401);
    });

    it("should return an empty array if the user doesn't own any templates in the group id", async () => {
      const groupId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: userId,
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      await formsDbConnection.collection('reports').insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/templates/versions/${groupId}`)
        .set('Authorization', 'USER')
        .expect(200);

      const data = response?.body?.data;
      expect(data).toBeDefined();
      expect(data).toBeInstanceOf(Array);
      expect(data).toHaveLength(0);
    });

    it('should return answer count for each version', async () => {
      const templateCollection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId = new mongoose.Types.ObjectId();
      const templates = await templateCollection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
      ]);

      const answerBolierplate = {
        report: undefined,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
      };
      await formsDbConnection.collection('answers').insertMany([
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[1] },
        { ...answerBolierplate, report: templates.insertedIds[1] },
        { ...answerBolierplate, report: templates.insertedIds[2] },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/templates/versions/${groupId}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      const answerCounts = {
        [templates.insertedIds[0].toString()]: 3,
        [templates.insertedIds[1].toString()]: 2,
        [templates.insertedIds[2].toString()]: 1,
        [templates.insertedIds[3].toString()]: 0,
      };
      response.body.data.forEach((t) => {
        const responseCount = t.attributes.answersCount;
        const expectedCount = answerCounts[t.id];
        expect(responseCount).toBe(expectedCount);
      });
    });
  });

  describe('GET /templates/versions/:id/latest', () => {
    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
      jest.clearAllMocks();
    });

    it('should return latest version in a group', async () => {
      const templateCollection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId = new mongoose.Types.ObjectId();
      const templates = await templateCollection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/templates/versions/${groupId}/latest`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: templates.insertedIds[2].toString(),
      });
    });

    it('should return the answer count for each version', async () => {
      const templateCollection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId = new mongoose.Types.ObjectId();
      const templates = await templateCollection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
      ]);

      const answerBolierplate = {
        report: undefined,
        reportName: 'answer 1',
        language: 'en',
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
      };
      await formsDbConnection.collection('answers').insertMany([
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[0] },
        { ...answerBolierplate, report: templates.insertedIds[1] },
        { ...answerBolierplate, report: templates.insertedIds[1] },
        { ...answerBolierplate, report: templates.insertedIds[2] },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/templates/versions/${groupId}/latest`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toBeDefined();
      const t = response.body.data;
      const responseCount = t.attributes.answersCount;
      expect(responseCount).toBe(6);
    });

    it('should return an array of areas', async () => {
      jest
        .spyOn(areaService, 'getAreaMICROSERVICE')
        .mockImplementation(
          (id) => ({ id, attributes: { name: 'SOME NAME' } } as any),
        );
      const templateCollection = formsDbConnection.collection('reports');
      const templateBoilerplate = {
        name: {
          en: 'Default',
        },
        user: new mongoose.Types.ObjectId(ROLES.USER.id),
        questions: [
          {
            type: 'text',
            name: 'question-1',
            label: {
              en: 'test',
            },
          },
        ],
        languages: ['en'],
        status: 'published',
        defaultLanguage: 'en',
      };

      const groupId = new mongoose.Types.ObjectId();
      const templates = await templateCollection.insertMany([
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: true,
        },
        {
          ...templateBoilerplate,
          editGroupId: groupId,
          isLatest: false,
        },
      ]);

      const areaIds = [new MongooseObjectId(), new MongooseObjectId()].map(
        (id) => id.toString(),
      );
      await apiDbConnection.collection('areatemplaterelations').insertOne({
        templateId: templates.insertedIds[2].toString(),
        areaId: areaIds[0],
      });
      await apiDbConnection.collection('areatemplaterelations').insertOne({
        templateId: templates.insertedIds[2].toString(),
        areaId: areaIds[1],
      });

      const response = await request(app.getHttpServer())
        .get(`/templates/versions/${groupId.toString()}/latest`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data.attributes.areas).toHaveLength(2);
      expect(response.body.data.attributes.areas[0].id).toBe(areaIds[0]);
      expect(response.body.data.attributes.areas[1].id).toBe(areaIds[1]);
    });
  });

  describe('PATCH /templates/:id/status', () => {
    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should update the status to published', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate, status: 'unpublished' });
      await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}/status`)
        .set('Authorization', 'USER')
        .send({ status: ETemplateStatus.PUBLISHED })
        .expect(200);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });

      expect(templateDb).toBeTruthy();
      expect(templateDb?.status).toBe('published');
    });

    it('should update status to unpublished', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate, status: 'published' });
      await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}/status`)
        .set('Authorization', 'USER')
        .send({ status: ETemplateStatus.UNPUBLISHED })
        .expect(200);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });

      expect(templateDb).toBeTruthy();
      expect(templateDb?.status).toBe('unpublished');
    });

    it('should fail if status not given', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate, status: 'unpublished' });
      await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}/status`)
        .set('Authorization', 'USER')
        .send({})
        .expect(400);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });

      expect(templateDb).toBeTruthy();
      expect(templateDb?.status).toBe('unpublished');
    });

    it('should fail if status is not a valid value', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.userTemplate, status: 'unpublished' });
      await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}/status`)
        .set('Authorization', 'USER')
        .send({ status: 'notValid' })
        .expect(400);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });

      expect(templateDb).toBeTruthy();
      expect(templateDb?.status).toBe('unpublished');
    });

    it("should fail if user doesn't own template and is not admin", async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.userTemplate,
        status: 'unpublished',
        user: new MongooseObjectId(),
      });
      await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}/status`)
        .set('Authorization', 'USER')
        .send({ status: ETemplateStatus.PUBLISHED })
        .expect(403);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });

      expect(templateDb).toBeTruthy();
      expect(templateDb?.status).toBe('unpublished');
    });

    it('should update status if user is admin and not owner', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        ...constants.userTemplate,
        status: 'unpublished',
        user: new MongooseObjectId(),
      });
      await request(app.getHttpServer())
        .patch(`/templates/${template.insertedId}/status`)
        .set('Authorization', 'ADMIN')
        .send({ status: ETemplateStatus.PUBLISHED })
        .expect(200);

      const templateDb = await formsDbConnection
        .collection('reports')
        .findOne({ _id: template.insertedId });

      expect(templateDb).toBeTruthy();
      expect(templateDb?.status).toBe('published');
    });
  });

  describe('GET /templates/public', () => {
    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should fetch all public templates', async () => {
      const templates = await formsDbConnection
        .collection('reports')
        .insertMany([
          {
            ...constants.defaultTemplate,
            public: true,
          },
          {
            ...constants.defaultTemplate,
            public: true,
          },
          {
            ...constants.defaultTemplate,
            public: true,
          },
        ]);

      const templateIds = Object.values(templates.insertedIds).map((v) =>
        v.toString(),
      );

      const response = await request(app.getHttpServer())
        .get('/templates/public')
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((d) => d.id).sort()).toEqual(
        templateIds.sort(),
      );
    });

    it('should fetch only public templates', async () => {
      const templates = await formsDbConnection
        .collection('reports')
        .insertMany([
          {
            ...constants.defaultTemplate,
            public: false,
          },
          {
            ...constants.defaultTemplate,
            public: true,
          },
          {
            ...constants.defaultTemplate,
            public: true,
          },
          {
            ...constants.defaultTemplate,
            public: true,
          },
        ]);

      const publicTemplateIds = Object.values(templates.insertedIds)
        .map((v) => v.toString())
        .slice(1);

      const response = await request(app.getHttpServer())
        .get('/templates/public')
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((d) => d.id).sort()).toEqual(
        publicTemplateIds.sort(),
      );
    });
  });

  describe('DELETE /templates/tidyUp', () => {
    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    afterEach(async () => {
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    });

    it('should delete reports with no templates', async () => {
      const defaultTemplate = await formsDbConnection
        .collection('reports')
        .insertOne({ ...constants.defaultTemplate });
      const managerTemplate = await formsDbConnection
        .collection('reports')
        .insertOne(constants.managerTemplate);
      const defaultAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: defaultTemplate.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const managerAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: managerTemplate.insertedId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const otherAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: constants.managerTemplate.editGroupId,
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });
      const floatingAnswer = await formsDbConnection
        .collection('answers')
        .insertOne({
          report: new mongoose.Types.ObjectId(),
          reportName: 'answer 1',
          language: 'en',
          user: new mongoose.Types.ObjectId(ROLES.USER.id),
          responses: [{ name: 'question-1', value: 'test' }],
        });

      const answer = await formsDbConnection
        .collection('answers')
        .findOne({ _id: floatingAnswer.insertedId });
      const answer2 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: defaultAnswer.insertedId });
      const answer3 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: managerAnswer.insertedId });
      const answer4 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: otherAnswer.insertedId });
      expect(answer?._id.toString()).toBe(floatingAnswer.insertedId.toString());
      expect(answer2?._id.toString()).toBe(defaultAnswer.insertedId.toString());
      expect(answer3?._id.toString()).toBe(managerAnswer.insertedId.toString());
      expect(answer4?._id.toString()).toBe(otherAnswer.insertedId.toString());

      await request(app.getHttpServer())
        .delete('/templates/tidyUp')
        .set('Authorization', 'USER')
        .expect(200);

      const answer5 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: floatingAnswer.insertedId });
      const answer6 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: defaultAnswer.insertedId });
      const answer7 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: managerAnswer.insertedId });
      const answer8 = await formsDbConnection
        .collection('answers')
        .findOne({ _id: otherAnswer.insertedId });
      expect(answer5?._id).toBeUndefined();
      expect(answer6?._id.toString()).toBe(defaultAnswer.insertedId.toString());
      expect(answer7?._id.toString()).toBe(managerAnswer.insertedId.toString());
      expect(answer8?._id.toString()).toBe(otherAnswer.insertedId.toString());
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
