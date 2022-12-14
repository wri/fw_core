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
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { TemplateAreaRelationService } from '../../areas/services/templateAreaRelation.service';
import { TemplateAreaRelation } from '../../areas/models/templateAreaRelation.schema';
import { TemplatesService } from '../../templates/templates.service';
import { Template } from '../../templates/models/template.schema';
import { AnswersService } from '../services/answers.service';
import { Answer } from '../models/answer.model';
import constants from './templates.constants'
import { S3Service } from '../services/s3Service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { TeamAreaRelation } from '../../areas/models/teamAreaRelation.schema';

// @ts-ignore
describe('Answers', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  let userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (id) => 'Full Name'
  }
  let s3Service = {
    uploadFile: (file, name) => `https://s3.amazonaws.com/bucket/folder/uuid.ext`
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
        TeamAreaRelationService,
        AnswersService,
        S3Service,
        {provide: getModelToken(Team.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(Template.name, 'formsDb'), useValue: jest.fn()},
        {provide: getModelToken(Answer.name, 'formsDb'), useValue: jest.fn()},
        {provide: getModelToken(TemplateAreaRelation.name, 'apiDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamAreaRelation.name, 'apiDb'), useValue: jest.fn()},
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .overrideProvider(S3Service)
      .useValue(s3Service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    teamsDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getTeamsHandle();
    apiDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getApiHandle();
    formsDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getFormsHandle();
  });

  describe('Permissions Middleware', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 404 if the template doesnt exist', async () => {
      const id = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
      .get(`/templates/${id.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(404)
    });

    it('should succeed if the user owns the template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate)
      await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should fail if the user doesnt own the template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.managerTemplate)
      await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(404)
    });

    it('should succeed if the template is public', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate)
      await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should succeed if the template is owned by a team manager', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.managerTemplate);
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Manager});
      await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(200)
    });
  });

  describe('GET /templates/:templateId/answers', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/templates/${2}/answers`)
      .expect(401)
    });

    it('should return an array all user answers', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const managerAnswer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const wrongTemplateAnswer = await formsDbConnection.collection('answers').insertOne({
        report: (new mongoose.Types.ObjectId()).toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 2',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id', userAnswer1.insertedId.toString());
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('reportName', 'answer 1');
      expect(response.body.data[1]).toHaveProperty('id', userAnswer2.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('attributes');
      expect(response.body.data[1].attributes).toHaveProperty('reportName', 'answer 2');
    });

    it('should return all monitor answers for managers', async () => {
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Manager});
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const managerAnswer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const wrongTemplateAnswer = await formsDbConnection.collection('answers').insertOne({
        report: (new mongoose.Types.ObjectId()).toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 2',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'MANAGER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id', managerAnswer.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('id', userAnswer1.insertedId.toString());
      expect(response.body.data[2]).toHaveProperty('id', userAnswer2.insertedId.toString());
      
    });

    it('should return all answers for template creator', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const managerAnswer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const wrongTemplateAnswer = await formsDbConnection.collection('answers').insertOne({
        report: (new mongoose.Types.ObjectId()).toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 2',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id', managerAnswer.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('id', userAnswer1.insertedId.toString());
      expect(response.body.data[2]).toHaveProperty('id', userAnswer2.insertedId.toString());
      
    });

    it('should return answer objects that contain full name of creator ', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const managerAnswer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const wrongTemplateAnswer = await formsDbConnection.collection('answers').insertOne({
        report: (new mongoose.Types.ObjectId()).toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const userAnswer2 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 2',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('fullName', 'Full Name');
      
    });

  });

  describe('GET /templates/:templateId/answers/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/templates/${2}/answers/${1}`)
      .expect(401)
    });

    it('should return a users answer', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', userAnswer1.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('report', template.insertedId.toString());
      expect(response.body.data.attributes).toHaveProperty('reportName', 'answer 1');

    });

    it('should return an answer containing the creators full name', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('fullName', "Full Name");

    });

    it('should return another users answer if the current user owns the template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', userAnswer1.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('report', template.insertedId.toString());
      expect(response.body.data.attributes).toHaveProperty('reportName', 'answer 1');

    });

    it('should fail to return another users answer if the current user doesnt own the template', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(404)

      expect(response.body).toHaveProperty('message', 'No answer found with your permissions')
    });

    it('should return another users answer if they are in a team with current user', async () => {
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const userAnswer1 = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/${userAnswer1.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', userAnswer1.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('report', template.insertedId.toString());
      expect(response.body.data.attributes).toHaveProperty('reportName', 'answer 1');
    });
  });

  describe('POST /templates/:templateId/answers', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .post(`/templates/${2}/answers`)
      .expect(401)
    });

    it('should create an answer', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      await request(app.getHttpServer())
      .post(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .send({
        reportName: "name", 
        language: 'en',
        'question-1': 'answer',
        clickedPosition: '[{"lat": -3.875649929046631,"lon": -64.98695373535156}]'
      })
      .expect(201)

      const answer = await formsDbConnection.collection('answers').findOne({report: template.insertedId.toString()});
      expect(answer).toBeDefined()
      expect(answer).toHaveProperty('reportName', 'name');
      expect(answer).toHaveProperty('responses');
      expect(answer.responses[0]).toHaveProperty('name', 'question-1');
      expect(answer.responses[0]).toHaveProperty('value', 'answer');
    });

    it('should return the created answer', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const response = await request(app.getHttpServer())
      .post(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .send({
        reportName: "name", 
        language: 'en',
        'question-1': 'answer',
        clickedPosition: '[{"lat": -3.875649929046631,"lon": -64.98695373535156}]'
      })
      .expect(201)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('responses');
      expect(response.body.data.attributes.responses[0]).toHaveProperty('name', 'question-1');
      expect(response.body.data.attributes.responses[0]).toHaveProperty('value', 'answer');
    });

    it('should save an image', async () => {

      const filename = "image.png";
      const fileData = Buffer.from("TestFileContent", "utf8");

      const template = await formsDbConnection.collection('templates').insertOne({
        ...constants.defaultTemplate,
        questions: [{
          "type": "blob",
          "name": "question-1",
          "conditions": [],
          "childQuestions": [],
          "order": 0,
          "required": false,
          "label": {
              "en": "test"
          }
      }],
      });
      const response = await request(app.getHttpServer())
      .post(`/templates/${template.insertedId.toString()}/answers`)
      .set('Authorization', 'USER')
      .attach('question-1',fileData, filename)
      .field({reportName: "name"})
      .field({language: 'en'})
      .field({clickedPosition: '[{"lat": -3.875649929046631,"lon": -64.98695373535156}]'})
      .expect(201)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('responses');
      expect(response.body.data.attributes.responses[0]).toHaveProperty('name', 'question-1');
      expect(response.body.data.attributes.responses[0]).toHaveProperty('value', 'https://s3.amazonaws.com/bucket/folder/uuid.ext');
    });
  });

  describe('DELETE /templates/:templateId/answers/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .delete(`/templates/${2}/answers/${1}`)
      .expect(401)
    });

    it('should delete a users answer', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const insertedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(insertedAnswer._id).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      const deletedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(deletedAnswer).toBeNull();
    });

    it('should fail to delete someone elses answer', async () => {
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const insertedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(insertedAnswer._id).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`)
      .set('Authorization', 'MANAGER')
      .expect(401)

      const deletedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(deletedAnswer._id).toBeDefined();
    });

    it('should delete answer in team area if user is team manager', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Manager});
      await apiDbConnection.collection('teamarearelations').insertOne({teamId: team.insertedId.toString(), areaId: areaId.toString()})
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        areaOfInterest: areaId.toString(),
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const insertedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(insertedAnswer._id).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`)
      .set('Authorization', 'MANAGER')
      .expect(200)

      const deletedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(deletedAnswer).toBeNull();
    });

    it('should fail to delete answer in team area if user is team monitor', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await apiDbConnection.collection('teamarearelations').insertOne({teamId: team.insertedId.toString(), areaId: areaId.toString()})
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        areaOfInterest: areaId.toString(),
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const insertedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(insertedAnswer._id).toBeDefined();
      await request(app.getHttpServer())
      .delete(`/templates/${template.insertedId.toString()}/answers/${answer.insertedId.toString()}`)
      .set('Authorization', 'MANAGER')
      .expect(401)

      const deletedAnswer = await formsDbConnection.collection('answers').findOne({'_id': answer.insertedId});
      expect(deletedAnswer._id).toBeDefined();
    });
  });

  describe('GET /templates/:templateId/answers/area/:areaId', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/templates/${2}/answers/area/${1}`)
      .expect(401)
    });

    it('should return users answers related to an area', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        areaOfInterest: areaId.toString(),
        language: 'en',
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/area/${areaId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('id', answer.insertedId.toString());
    });

    it('should return answers containing the creators full name', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection.collection('templates').insertOne(constants.userTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        language: 'en',
        areaOfInterest: areaId.toString(),
        user: ROLES.USER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/area/${areaId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('fullName', "Full Name");

    });
    it('should not return other users answers related to an area', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        areaOfInterest: areaId.toString(),
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/area/${areaId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.length).toBe(0);
    });

    it('should return other users answers related to an area if on the same team', async () => {
      const areaId = new mongoose.Types.ObjectId();
      const template = await formsDbConnection.collection('templates').insertOne(constants.defaultTemplate);
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await apiDbConnection.collection('teamarearelations').insertOne({teamId: team.insertedId.toString(), areaId: areaId.toString()})
      const answer = await formsDbConnection.collection('answers').insertOne({
        report: template.insertedId.toString(),
        reportName: 'answer 1',
        areaOfInterest: areaId.toString(),
        language: 'en',
        user: ROLES.MANAGER.id,
        responses: [{name: "question-1", value: "test"}]
      });
      const response = await request(app.getHttpServer())
      .get(`/templates/${template.insertedId.toString()}/answers/area/${areaId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('id', answer.insertedId.toString());
    });
  });

  afterAll(async () => {

    await app.close();
  })
});