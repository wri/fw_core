// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
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
import { AnswersService } from '../../answers/services/answers.service';
import { Answer } from '../../answers/models/answer.model';
import areaConstants from '../../areas/test/area.constants';
import assignments from './assignments.constants';
import { S3Service } from '../../answers/services/s3Service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { AssignmentsService } from '../assignments.service';
import { Assignment } from '../models/assignment.schema';
import { AreasService } from '../../areas/services/areas.service';
import { GeostoreService } from '../../areas/services/geostore.service';
import { CoverageService } from '../../areas/services/coverage.service';
import { DatasetService } from '../../areas/services/dataset.service';

describe('Assignments', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (id) => 'Full Name',
  };
  const areaService = {
    getAreaMICROSERVICE: (id) => {
      if (id === areaConstants.testArea.id) return areaConstants.testArea;
      else if (id === areaConstants.testTeamArea.id)
        return areaConstants.testTeamArea;
      else return null;
    },
  };
  const s3Service = {
    uploadFile: (file, name) =>
      `https://s3.amazonaws.com/bucket/folder/uuid.ext`,
  };
  const geostoreService = {
    getGeostore: (id, token) => assignments.geostore,
    createGeostore: (id, token) => assignments.geostore,
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
        AssignmentsService,
        AreasService,
        GeostoreService,
        CoverageService,
        DatasetService,
        S3Service,
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
          provide: getModelToken(Assignment.name, 'formsDb'),
          useValue: jest.fn(),
        },
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .overrideProvider(AreasService)
      .useValue(areaService)
      .overrideProvider(S3Service)
      .useValue(s3Service)
      .overrideProvider(GeostoreService)
      .useValue(geostoreService)
      .compile();

    app = moduleRef.createNestApplication();
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

  describe('POST /assignments', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .post(`/assignments`)
        .expect(401);
    });

    it('should create an assignment', async () => {
      await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      const createdAssignment = await formsDbConnection
        .collection('assignments')
        .findOne({});
      expect(createdAssignment).toBeDefined();
      expect(createdAssignment).toHaveProperty('notes', 'some notes');
    });

    it('should return the created assignment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'notes',
        'some notes',
      );
    });

    it('should store the assignment creator', async () => {
      const response = await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'createdBy',
        ROLES.MANAGER.id,
      );
    });

    it('should create a name', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
          createdBy: ROLES.USER.id,
        });
      const response = await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', `FN-0002`);
    });

    it('should fail if area doesnt exist', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });
      const response = await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          areaId: new mongoose.Types.ObjectId(),
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(404);
    });
    it('should contain geostore information', async () => {
      const response = await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('geostore');
      expect(response.body.data.attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });
  });

  describe('GET /assignments/user', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/user`)
        .expect(401);
    });

    it('should return an array of user assignments', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const assignment2 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          monitors: [ROLES.MANAGER.id, ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [ROLES.MANAGER.id],
        createdBy: ROLES.ADMIN.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/user`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'name');
      expect(response.body.data[0].attributes).toHaveProperty('geostore');
      expect(response.body.data[0].attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        assignment2.insertedId.toString(),
      );
      expect(response.body.data[1].attributes).toHaveProperty('geostore');
      expect(response.body.data[1].attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });
  });

  describe('GET /assignments/teams', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/teams`)
        .expect(401);
    });

    it('should return an array of team assignments', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      const team2 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test2' });
      const team3 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test3' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team3.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });

      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [],
          teamIds: [team.insertedId.toString()],
          createdBy: ROLES.ADMIN.id,
        });
      const assignment2 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          monitors: [],
          teamIds: [team.insertedId.toString(), team2.insertedId.toString()],
          createdBy: ROLES.ADMIN.id,
        });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        teamIds: [team2.insertedId.toString()],
        createdBy: ROLES.ADMIN.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/teams`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'name');
      expect(response.body.data[1]).toHaveProperty(
        'id',
        assignment2.insertedId.toString(),
      );
      expect(response.body.data[1].attributes).toHaveProperty('geostore');
      expect(response.body.data[1].attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });
  });

  describe('GET /assignments/open', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/open`)
        .expect(401);
    });

    it('should return an array of open user assignments', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          status: 'open',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.USER.id,
        });

      const assignment2 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          status: 'on hold',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.USER.id,
        });

      const assignment3 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          status: 'open',
          monitors: [ROLES.MANAGER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const assignment4 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          status: 'completed',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.USER.id,
        });

      const response = await request(app.getHttpServer())
        .get(`/assignments/open`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        assignment2.insertedId.toString(),
      );
      expect(response.body.data[1].attributes).toHaveProperty('geostore');
      expect(response.body.data[1].attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });
  });

  describe('GET /assignments/areas/:areaId', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/areas/${1}`)
        .expect(401);
    });

    it('should return a 404 if area doesnt exist', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/areas/${1}`)
        .set('Authorization', 'USER')
        .expect(404);
    });

    it('should return an array of team assignments with the area id', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      const team2 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });

      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          areaId: areaConstants.testArea.id,
          monitors: [],
          teamIds: [team.insertedId.toString()],
          createdBy: ROLES.ADMIN.id,
        });
      const assignment2 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          areaId: areaConstants.testArea.id,
          monitors: [],
          teamIds: [team.insertedId.toString()],
          createdBy: ROLES.ADMIN.id,
        });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testTeamArea.id,
        teamIds: [team.insertedId.toString()],
        createdBy: ROLES.ADMIN.id,
      });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testArea.id,
        teamIds: [team2.insertedId.toString()],
        createdBy: ROLES.ADMIN.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/areas/${areaConstants.testArea.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'name');
      expect(response.body.data[1]).toHaveProperty(
        'id',
        assignment2.insertedId.toString(),
      );
      expect(response.body.data[1].attributes).toHaveProperty('geostore');
      expect(response.body.data[1].attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });
  });

  describe('GET /assignments/allOpenUserForArea/:areaId', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/allOpenUserForArea/${1}`)
        .expect(401);
    });

    it('should return a 404 if area doesnt exist', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/allOpenUserForArea/${1}`)
        .set('Authorization', 'USER')
        .expect(404);
    });

    it('should return an array of open user assignments with the area id', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          status: 'open',
          areaId: areaConstants.testArea.id,
          monitors: [ROLES.USER.id],
          teamIds: [],
          createdBy: ROLES.ADMIN.id,
        });
      const assignment2 = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'some other name',
          status: 'on hold',
          areaId: areaConstants.testArea.id,
          monitors: [],
          teamIds: [],
          createdBy: ROLES.USER.id,
        });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'some other name',
        status: 'completed',
        areaId: areaConstants.testArea.id,
        monitors: [],
        teamIds: [],
        createdBy: ROLES.USER.id,
      });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testTeamArea.id,
        teamIds: [],
        createdBy: ROLES.USER.id,
      });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testTeamArea.id,
        teamIds: [],
        createdBy: ROLES.USER.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/allOpenUserForArea/${areaConstants.testArea.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        assignment2.insertedId.toString(),
      );
      expect(response.body.data[1].attributes).toHaveProperty('geostore');
      expect(response.body.data[1].attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });
  });

  describe('GET /assignments/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/assignments/${1}`)
        .expect(401);
    });

    it('should return an assignment', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .get(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data.attributes).toHaveProperty('geostore');
      expect(response.body.data.attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });

    it('should include the area name', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .get(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'areaName',
        areaConstants.testArea.attributes.name,
      );
    });

    it('should return undefined area name if area doesnt exist', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          areaId: new mongoose.Types.ObjectId(),
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .get(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'areaName',
        undefined,
      );
    });
  });

  describe('PATCH /assignments/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .patch(`/assignments/${1}`)
        .expect(401);
    });

    it('should update an assignment', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .send({
          name: 'different name',
          monitors: [ROLES.USER.id, ROLES.MANAGER.id],
        })
        .expect(200);

      const updatedAssignment = await formsDbConnection
        .collection('assignments')
        .findOne({ _id: assignment.insertedId });
      expect(updatedAssignment).toBeDefined();
      expect(updatedAssignment).toHaveProperty('name', 'different name');
      expect(updatedAssignment).toHaveProperty('monitors');
      expect(updatedAssignment?.monitors.length).toBe(2);
    });

    it('should return the updated assignment', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .send({
          name: 'different name',
          monitors: [ROLES.USER.id, ROLES.MANAGER.id],
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'name',
        'different name',
      );
      expect(response.body.data.attributes).toHaveProperty('monitors');
      expect(response.body.data.attributes.monitors.length).toBe(2);
      expect(response.body.data.attributes).toHaveProperty('geostore');
      expect(response.body.data.attributes.geostore).toHaveProperty(
        'id',
        assignments.geostore.id,
      );
    });

    it('shouldnt update disallowed fields', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .send({
          name: 'different name',
          createdBy: ROLES.MANAGER.id,
          alert: 'something',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'name',
        'different name',
      );
      expect(response.body.data.attributes).toHaveProperty(
        'createdBy',
        ROLES.ADMIN.id,
      );
      expect(response.body.data.attributes).toHaveProperty(
        'alert',
        assignments.defaultAssignment.alert,
      );
    });

    it('should fail if user did not create assignment', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .send({
          name: 'different name',
          monitors: [ROLES.USER.id, ROLES.MANAGER.id],
        })
        .expect(403);
    });

    it('should fail if assignment has "completed" status', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          status: 'completed',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .send({
          name: 'different name',
          monitors: [ROLES.USER.id, ROLES.MANAGER.id],
        })
        .expect(403);
    });
  });

  describe('DELETE /assignments/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/assignments/${1}`)
        .expect(401);
    });

    it('should delete an assignment', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .delete(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .expect(200);

      const deletedAssignment = await formsDbConnection
        .collection('assignments')
        .findOne({ _id: assignment.insertedId });
      expect(deletedAssignment).toBeNull();
    });

    it('should fail if user did not create assignment', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const response = await request(app.getHttpServer())
        .delete(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
