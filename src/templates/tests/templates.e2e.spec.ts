// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest'
import { HttpException, HttpStatus, INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing";
import { UserService } from '../../common/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
import { EMemberRole, EMemberStatus, TeamMember } from '../../teams/models/teamMember.schema';
import { Team } from '../../teams/models/team.schema';
import { Template, ETemplateStatus } from '../models/template.schema';
import { TemplatesService } from '../templates.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import constants from './templates.constants'

// @ts-ignore
describe('Areas', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  let userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (id) => 'Full Name'
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        UserService, 
        DatabaseService,
        TeamsService,
        TeamMembersService,
        TemplatesService,
        {provide: getModelToken(Team.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(Template.name, 'formsDb'), useValue: jest.fn()}
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    teamsDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getTeamsHandle();
    apiDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getApiHandle();
    formsDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getFormsHandle();
  });

  describe('POST /templates', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .post(`/templates`)
      .expect(401)
    });

    it('should fail if no name supplied', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({defaultLanguage: 'en'})
      .expect(400)

      expect(response.body).toHaveProperty('message', "Request body is missing field 'name'");
    });

    it('should fail if no questions supplied', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: 'test',
        defaultLanguage: 'en'
      })
      .expect(400)

      expect(response.body).toHaveProperty('message', "Request body is missing field 'questions'");
    });

    it('should fail if no languages supplied', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: 'test',
        questions: [],
        defaultLanguage: 'en'
      })
      .expect(400)

      expect(response.body).toHaveProperty('message', "Request body is missing field 'languages'");
    });

    it('should fail if no status supplied', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: 'test',
        questions: [],
        languages: [],
        defaultLanguage: 'en'
      })
      .expect(400)

      expect(response.body).toHaveProperty('message', "Request body is missing field 'status'");
    });

    it('should fail if wrong status supplied', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: 'test',
        questions: [],
        languages: [],
        status: 'status', 
        defaultLanguage: 'en'
      })
      .expect(400)

      expect(response.body).toHaveProperty('message', "Status must be published or unpublished");
    });

    it('should fail if report name doesnt match languages', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: {
          fr: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en'
      })
      .expect(400)

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('Report name', "values do not match language options");
    });

    it('should fail if question label doesnt match languages', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: {
          en: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "fr": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en'
      })
      .expect(400)

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty("name", "Question question-1: label does not match language options");
    });

    it('should succeed with a 201', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: {
          en: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en'
      })
      .expect(201)
    });

    it('should return the saved template', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: {
          en: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en'
      })
      .expect(201)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name');
      expect(response.body.data.attributes.name).toHaveProperty('en', 'test');
    });

    it('should create a template', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: {
          en: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en'
      })
      .expect(201)

      const template = await formsDbConnection.collection('templates').findOne({'_id': new mongoose.Types.ObjectId(response.body.data.id)});
      expect(template).toBeDefined;
      expect(template).toHaveProperty('_id', new mongoose.Types.ObjectId(response.body.data.id));
      expect(template).toHaveProperty('name');
      expect(template.name).toHaveProperty('en', 'test');
    });

    it('should fail to create a public template if not ADMIN', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'USER')
      .send({
        name: {
          en: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en',
        public: true
      })
      .expect(403)
    });

    it('should create a public template if ADMIN', async () => {
      const response = await request(app.getHttpServer())
      .post(`/templates`)
      .set('Authorization', 'ADMIN')
      .send({
        name: {
          en: 'test'
        },
        questions: [{
          "type": "text",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
        languages: ["en"],
        status: 'published', 
        defaultLanguage: 'en',
        public: true
      })
      .expect(201)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('public', true);
    });
  });

  describe('GET /templates', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/templates`)
      .expect(401)
    });

    it('should return an array of templates', async () => {
      const response = await request(app.getHttpServer())
      .get(`/templates`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true)
    });

    it('should return the default template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      const response = await request(app.getHttpServer())
      .get(`/templates`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('id', template.insertedId.toString());
    });

    it('should return the default template and users templates', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      const template2 = await formsDbConnection.collection('templates').insertOne(constants.managerTemplate)
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      const response = await request(app.getHttpServer())
      .get(`/templates`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id', template.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('id', template3.insertedId.toString());
    });

  });

  describe('GET /templates/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/templates/${1}`)
      .expect(401)
    });

    it('should return a template', async () => {
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      const response = await request(app.getHttpServer())
      .get(`/templates/${template3.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', template3.insertedId.toString());
      
    });

    it('should return a template with user answers count for user', async () => {
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      })

      const response = await request(app.getHttpServer())
      .get(`/templates/${template3.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', template3.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 1);
      
    });

    it('should return a template with every answers count for template creator', async () => {
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      })

      const response = await request(app.getHttpServer())
      .get(`/templates/${template3.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', template3.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 2);
      
    });

    it('should return a template with every answers count for admin', async () => {
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      })

      const response = await request(app.getHttpServer())
      .get(`/templates/${template3.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', template3.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 2);
      
    });

  });
  afterAll(async () => {

    await app.close();
  })
});