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
import { TemplateAreaRelationService } from '../../areas/services/templateAreaRelation.service';
import { TemplateAreaRelation } from '../../areas/models/templateAreaRelation.schema';

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
        TemplateAreaRelationService,
        {provide: getModelToken(Team.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(Template.name, 'formsDb'), useValue: jest.fn()},
        {provide: getModelToken(TemplateAreaRelation.name, 'apiDb'), useValue: jest.fn()},
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

  describe('GET /templates/getAllAnswersForUser', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/templates/getAllAnswersForUser`)
      .expect(401)
    });

    it('should return all user answers and team answers of teams user manages', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      const template2 = await formsDbConnection.collection('templates').insertOne(constants.managerTemplate)
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      
      const managerAnswer = await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const managerAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.ADMIN.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const userAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })

      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member1 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, role: EMemberRole.Monitor, status: EMemberStatus.Confirmed})
      const member2 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, role: EMemberRole.Manager, status: EMemberStatus.Confirmed})
      
      const response = await request(app.getHttpServer())
      .get(`/templates/getAllAnswersForUser`)
      .set('Authorization', 'MANAGER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(4);
      expect(response.body.data[0]).toHaveProperty('id',managerAnswer.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('id',managerAnswer2.insertedId.toString());
      expect(response.body.data[2]).toHaveProperty('id',userAnswer1.insertedId.toString());
      expect(response.body.data[3]).toHaveProperty('id',userAnswer2.insertedId.toString());
    });

    it('should return all user answers but not team answers if not manager', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      const template2 = await formsDbConnection.collection('templates').insertOne(constants.managerTemplate)
      const template3 = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      
      const managerAnswer = await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const managerAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.ADMIN.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template3.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const userAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })

      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member1 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, role: EMemberRole.Monitor, status: EMemberStatus.Confirmed})
      const member2 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, role: EMemberRole.Manager, status: EMemberStatus.Confirmed})
      
      const response = await request(app.getHttpServer())
      .get(`/templates/getAllAnswersForUser`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id',userAnswer1.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('id',userAnswer2.insertedId.toString());
    });
  });

  describe('DELETE /templates/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .delete(`/templates/${2}`)
      .expect(401)
    });

    it('should delete an unpublished template without answers', async () => {
      const template = await formsDbConnection.collection('templates').insertOne({
        ...constants.userTemplate,
        status: 'unpublished'
      });
      const createdTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(createdTemplate).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      const deletedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(deletedTemplate).toBeNull();
    });

    it('should fail to delete a published template without answers', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const createdTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(createdTemplate).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should fail to delete an upublished template with answers', async () => {
      const template = await formsDbConnection.collection('templates').insertOne({
        ...constants.userTemplate,
        status: 'unpublished'
      });
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })      
      const createdTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(createdTemplate).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed to delete an published template with answers and all answers if the user is ADMIN', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })      
      const createdTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(createdTemplate).toBeDefined();
      const createdAnswer = await formsDbConnection.collection('answers').findOne({'_id': userAnswer1.insertedId})
      expect(createdAnswer).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .expect(200)

      const deletedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(deletedTemplate).toBeNull();
      const deletedAnswer = await formsDbConnection.collection('answers').findOne({'_id': userAnswer1.insertedId})
      expect(deletedAnswer).toBeNull();
    });

    it('should delete template area relations', async () => {
      const template = await formsDbConnection.collection('templates').insertOne({
        ...constants.userTemplate,
        status: 'unpublished'
      });
      const relation = await apiDbConnection.collection('templatearearelations').insertOne({templateId: template.insertedId.toString(), areaId: new mongoose.Types.ObjectId()})
      const createdTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(createdTemplate).toBeDefined();
      const createdRelation = await apiDbConnection.collection('templatearearelations').findOne({'_id': relation.insertedId});
      expect(createdRelation).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      const deletedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(deletedTemplate).toBeNull();
      const deletedRelation = await apiDbConnection.collection('templatearearelations').findOne({'_id': relation.insertedId});
      expect(deletedRelation).toBeNull();
    });
  });

  describe('PATCH /templates/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/templates/${2}`)
      .expect(401)
    });

    it('should fail in changing a different users template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      return await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'MANAGER')
      .expect(403)
    });

    it('should succeed in changing a users template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      return await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should change the template name', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({name: "different name"})
      .expect(200)

      const changedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(changedTemplate).toHaveProperty('name','different name');
    });

    it('should change the template status', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({status: "unpublished"})
      .expect(200)

      const changedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(changedTemplate).toHaveProperty('status','unpublished');
    });

    it('should change the template languages', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({languages: ['en', 'fr']})
      .expect(200)

      const changedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(changedTemplate).toHaveProperty('languages',['en', 'fr']);
    });

    it('should fail to make the template public if user', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({public: true})
      .expect(200)

      const changedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(changedTemplate).toHaveProperty('public', false)
    });

    it('should make the template public if admin', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .send({public: true})
      .expect(200)

      const changedTemplate = await formsDbConnection.collection('templates').findOne({'_id': template.insertedId});
      expect(changedTemplate).toHaveProperty('public', true)
    });

    it('should return the template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const response = await request(app.getHttpServer())
      .patch(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({name: 'different name'})
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', template.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'different name')
    });

    it('should return a template with every answers count', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({name: "different name"})
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', template.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('answersCount', 1);
    });
  });

  describe('DELETE /templates/deleteAllAnswers', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .delete(`/templates/deleteAllAnswers`)
      .expect(401)
    });

    it('should delete all a users answers for all templates', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      const template2 = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      const answer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const answer2 =await formsDbConnection.collection('answers').insertOne({
        report: template2.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const answer3 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.ADMIN.id,
        responses: [{name: "question-1", value: "test"}]
      })
      const createdAnswer1 = await formsDbConnection.collection('answers').findOne({'_id': answer1.insertedId});
      expect(createdAnswer1).toBeDefined();
      const createdAnswer2 = await formsDbConnection.collection('answers').findOne({'_id': answer2.insertedId});
      expect(createdAnswer2).toBeDefined();
      const createdAnswer3 = await formsDbConnection.collection('answers').findOne({'_id': answer3.insertedId});
      expect(createdAnswer3).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/deleteAllAnswers`)
      .set('Authorization', 'USER')
      .expect(200)

      const deletedAnswer1 = await formsDbConnection.collection('answers').findOne({'_id': answer1.insertedId});
      expect(deletedAnswer1).toBeNull();
      const deletedAnswer2 = await formsDbConnection.collection('answers').findOne({'_id': answer2.insertedId});
      expect(deletedAnswer2).toBeNull();
      const deletedAnswer3 = await formsDbConnection.collection('answers').findOne({'_id': answer3.insertedId});
      expect(deletedAnswer3).toBeDefined();

    });
  });

  afterAll(async () => {

    await app.close();
  })
});