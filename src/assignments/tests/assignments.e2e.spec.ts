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
import { AnswersService } from '../../answers/services/answers.service';
import { Answer } from '../../answers/models/answer.model';
import constants from './templates.constants'
import assignments from './assignments.constants'
import { S3Service } from '../../answers/services/s3Service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { TeamAreaRelation } from '../../areas/models/teamAreaRelation.schema';
import { AssignmentsService } from '../assignments.service';
import { Assignment } from '../models/assignment.schema';

// @ts-ignore
describe('Assignments', () => {
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
        AssignmentsService,
        S3Service,
        {provide: getModelToken(Team.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(Template.name, 'formsDb'), useValue: jest.fn()},
        {provide: getModelToken(Answer.name, 'formsDb'), useValue: jest.fn()},
        {provide: getModelToken(TemplateAreaRelation.name, 'apiDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamAreaRelation.name, 'apiDb'), useValue: jest.fn()},
        {provide: getModelToken(Assignment.name, 'formsDb'), useValue: jest.fn()},
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

  describe('POST /assignments', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .post(`/assignments`)
      .expect(401)
    });

    it('should create an assignment', async () => {
      await request(app.getHttpServer())
      .post(`/assignments`)
      .send({
        ...assignments.defaultAssignment,
        name: "new assignment",
        monitors: [ROLES.USER.id],
      })
      .set('Authorization', 'MANAGER')
      .expect(201)

      const createdAssignment = await formsDbConnection.collection('assignments').findOne({name: 'new assignment'});
      expect(createdAssignment).toBeDefined();
      expect(createdAssignment).toHaveProperty('name', 'new assignment');

    });

    it('should return the created assignment', async () => {
      const response = await request(app.getHttpServer())
      .post(`/assignments`)
      .send({
        ...assignments.defaultAssignment,
        name: "new assignment",
        monitors: [ROLES.USER.id],
      })
      .set('Authorization', 'MANAGER')
      .expect(201)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes')
      expect(response.body.data.attributes).toHaveProperty('name', 'new assignment')
    });

    it('should store the assignment creator', async () => {
      const response = await request(app.getHttpServer())
      .post(`/assignments`)
      .send({
        ...assignments.defaultAssignment,
        name: "new assignment",
        monitors: [ROLES.USER.id],
      })
      .set('Authorization', 'MANAGER')
      .expect(201)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes')
      expect(response.body.data.attributes).toHaveProperty('createdBy', ROLES.MANAGER.id)
    });
  });

  describe('GET /assignments/user', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/assignments/user`)
      .expect(401)
    });

    it('should return an array of user assignments', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const assignment2 = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "some other name",
        monitors: [ROLES.MANAGER.id, ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "not visible",
        monitors: [ROLES.MANAGER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .get(`/assignments/user`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id', assignment.insertedId.toString());
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'name');
      expect(response.body.data[1]).toHaveProperty('id', assignment2.insertedId.toString());

    });
  });

  describe('GET /assignments/teams', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/assignments/teams`)
      .expect(401)
    });

    it('should return an array of team assignments', async () => {

      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const team2 = await teamsDbConnection.collection('teams').insertOne({name: 'Test2'});
      const team3 = await teamsDbConnection.collection('teams').insertOne({name: 'Test3'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team3.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [],
        teamIds: [team.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });
      const assignment2 = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "some other name",
        monitors: [],
        teamIds: [team.insertedId.toString(), team2.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "not visible",
        monitors: [],
        teamIds: [team2.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .get(`/assignments/teams`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id', assignment.insertedId.toString());
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'name');
      expect(response.body.data[1]).toHaveProperty('id', assignment2.insertedId.toString());

    });
  });

  describe('GET /assignments/areas/:areaId', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/assignments/areas/${1}`)
      .expect(401)
    });

    it('should return an array of team assignments with the area id', async () => {
      const area1 = new mongoose.Types.ObjectId();
      const area2 = new mongoose.Types.ObjectId();
      const team = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const team2 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
     
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        areaId: area1.toString(),
        monitors: [],
        teamIds: [team.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });
      const assignment2 = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "some other name",
        areaId: area1.toString(),
        monitors: [],
        teamIds: [team.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "not visible",
        monitors: [],
        areaId: area2.toString(),
        teamIds: [team.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "not visible",
        monitors: [],
        areaId: area1.toString(),
        teamIds: [team2.insertedId.toString()],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .get(`/assignments/areas/${area1.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id', assignment.insertedId.toString());
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'name');
      expect(response.body.data[1]).toHaveProperty('id', assignment2.insertedId.toString());

    });
  });

  describe('GET /assignments/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/assignments/${1}`)
      .expect(401)
    });

    it('should return an assignment', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .get(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', assignment.insertedId.toString())

    });
  });

  describe('PATCH /assignments/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/assignments/${1}`)
      .expect(401)
    });

    it('should update an assignment', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .patch(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .send({
        name: 'different name',
        monitors: [ROLES.USER.id, ROLES.MANAGER.id]
      })
      .expect(200)

      const updatedAssignment = await formsDbConnection.collection('assignments').findOne({_id: assignment.insertedId});
      expect(updatedAssignment).toBeDefined();
      expect(updatedAssignment).toHaveProperty('name', 'different name');
      expect(updatedAssignment).toHaveProperty('monitors')
      expect(updatedAssignment.monitors.length).toBe(2)

    });

    it('should return the updated assignment', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .patch(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .send({
        name: 'different name',
        monitors: [ROLES.USER.id, ROLES.MANAGER.id]
      })
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', assignment.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes')
      expect(response.body.data.attributes).toHaveProperty('name', 'different name')
      expect(response.body.data.attributes).toHaveProperty('monitors')
      expect(response.body.data.attributes.monitors.length).toBe(2)

    });

    it('shouldnt update disallowed fields', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .patch(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .send({
        name: "different name",
        createdBy: ROLES.MANAGER.id,
        alert: "something"
      })
      .expect(200)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', assignment.insertedId.toString());
      expect(response.body.data).toHaveProperty('attributes')
      expect(response.body.data.attributes).toHaveProperty('name', 'different name')
      expect(response.body.data.attributes).toHaveProperty('createdBy', ROLES.ADMIN.id)
      expect(response.body.data.attributes).toHaveProperty('alert', assignments.defaultAssignment.alert)

    });

    it('should fail if user did not create assignment', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .patch(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({
        name: 'different name',
        monitors: [ROLES.USER.id, ROLES.MANAGER.id]
      })
      .expect(403)

    });

    it('should fail if assignment has "completed" status', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        status: "completed",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .patch(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .send({
        name: 'different name',
        monitors: [ROLES.USER.id, ROLES.MANAGER.id]
      })
      .expect(403)

    });
  });

  describe('DELETE /assignments/:id', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
      await formsDbConnection.collection('templates').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .delete(`/assignments/${1}`)
      .expect(401)
    });

    it('should delete an assignment', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .delete(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'ADMIN')
      .expect(200)

      const deletedAssignment = await formsDbConnection.collection('assignments').findOne({_id: assignment.insertedId});
      expect(deletedAssignment).toBeNull();

    });

    it('should fail if user did not create assignment', async () => {
      
      const assignment = await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        name: "name",
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id
      });

      const response = await request(app.getHttpServer())
      .delete(`/assignments/${assignment.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(403)

    });
  });

  afterAll(async () => {

    await app.close();
  })
});