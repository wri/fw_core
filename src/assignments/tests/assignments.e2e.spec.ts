import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserService } from '../../common/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
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
import templatesConstants from './templates.constants';
import { EMemberRole } from '../../teams/models/teamMember.schema';
import { CreateAssignmentInput } from '../inputs/create-assignments.input';
import { AssignmentStatus } from '../assignment-status.enum';

describe('Assignments', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let formsDbConnection: Connection;
  let apiDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (_id) => 'Full Name',
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
    uploadFile: (_file, _name) =>
      `https://s3.amazonaws.com/bucket/folder/uuid.ext`,
  };
  const geostoreService = {
    getGeostore: (_id, _token) => assignments.geostore,
    createGeostore: (_id, _token) => assignments.geostore,
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
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    teamsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getTeamsHandle();
    formsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getFormsHandle();
    apiDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getApiHandle();
  });

  describe('POST /assignments', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    const createAssignmentInput: CreateAssignmentInput = {
      areaId: 'dummy',
      monitors: [],
      priority: 1,
      templateIds: [],
      location: [],
    };

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

    it('should create an assignment by form data', async () => {
      const fields: any = {
        ...assignments.defaultAssignment,
        'monitors[]': ROLES.USER.id,
        geostore: JSON.stringify(assignments.defaultAssignment.geostore),
      };
      delete fields.location;
      await request(app.getHttpServer())
        .post(`/assignments`)
        .field(fields)
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
      await formsDbConnection.collection('assignments').insertOne({
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
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id,
      });
      await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...createAssignmentInput,
          areaId: new mongoose.Types.ObjectId(),
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(400);
    });

    it('should fail if neither geostore nor location are sent', async () => {
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id,
      });
      await request(app.getHttpServer())
        .post(`/assignments`)
        .send({
          ...assignments.defaultAssignment,
          location: undefined,
          geostore: undefined,
          areaId: new mongoose.Types.ObjectId(),
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(400);
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

    it('should save an image', async () => {
      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const response = await request(app.getHttpServer())
        .post(`/assignments`)
        .attach('image', fileData, filename)
        .field('monitors[]', ROLES.USER.id)
        .field('location[0][lat]', 1)
        .field('location[0][lon]', 1)
        .field('location[0][alertType]', 'null')
        .field('priority', 1)
        .field('status', 'open')
        .field('areaId', areaConstants.testArea.id)
        .field('areaName', areaConstants.testArea.attributes.name)
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'image',
        `https://s3.amazonaws.com/bucket/folder/uuid.ext`,
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

/*     it('should return assignments assigned to user', async () => {
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

    it('should return assignments created by the user', async () => {
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
        createdBy: ROLES.USER.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/user`)
        .set('Authorization', 'ADMIN')
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
    });

    it('should return assignments assigned to managed users', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'test team' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
        email: 'email',
        role: EMemberRole.Administrator,
      });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: 'email',
        role: EMemberRole.Monitor,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        areaId: areaConstants.testArea.id.toString(),
        teamId: team.insertedId.toString(),
      });
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        createdBy: new mongoose.Types.ObjectId(),
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/user`)
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        assignment.insertedId.toString(),
      );
    });

    it('should return assignments containing an array of templates', async () => {
      const template = await formsDbConnection
        .collection('reports')
        .insertOne({ ...templatesConstants.defaultTemplate });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'name',
        templateIds: [template.insertedId.toString()],
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/user`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      const returnedAssignment = response.body.data[0];

      expect(returnedAssignment.attributes.templates[0]._id).toBe(
        template.insertedId.toString(),
      );
    });

    it('should return assignments containing an array of monitor names', async () => {
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'name',
        monitors: [ROLES.USER.id],
        createdBy: ROLES.ADMIN.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/assignments/user`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      const returnedAssignment = response.body.data[0];
      expect(returnedAssignment).toHaveProperty('attributes');
      expect(returnedAssignment.attributes).toHaveProperty('monitorNames');
      expect(returnedAssignment.attributes.monitorNames[0]).toHaveProperty(
        'id',
        ROLES.USER.id,
      );
      expect(returnedAssignment.attributes.monitorNames[0]).toHaveProperty(
        'name',
        'Full Name',
      );
    }); */
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

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'some other name',
        status: 'open',
        monitors: [ROLES.MANAGER.id],
        createdBy: ROLES.ADMIN.id,
      });

      await formsDbConnection.collection('assignments').insertOne({
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

    it('should return an array of assignments with the area id', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          areaId: areaConstants.testArea.id,
          monitors: [],
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
          createdBy: ROLES.ADMIN.id,
        });

      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testTeamArea.id,
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
          createdBy: ROLES.USER.id,
        });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'some other name',
        status: 'completed',
        areaId: areaConstants.testArea.id,
        monitors: [],
        createdBy: ROLES.USER.id,
      });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testTeamArea.id,
        createdBy: ROLES.USER.id,
      });
      await formsDbConnection.collection('assignments').insertOne({
        ...assignments.defaultAssignment,
        geostore: assignments.geostore.id,
        name: 'not visible',
        monitors: [],
        areaId: areaConstants.testTeamArea.id,
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

      await request(app.getHttpServer())
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

      await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'ADMIN')
        .send({
          name: 'different name',
          createdBy: ROLES.MANAGER.id,
          alert: 'something',
        })
        .expect(400);
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

      await request(app.getHttpServer())
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

      await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .send({
          name: 'different name',
          monitors: [ROLES.USER.id, ROLES.MANAGER.id],
        })
        .expect(403);
    });

    it('should save an image', async () => {
      const assignment = await formsDbConnection
        .collection('assignments')
        .insertOne({
          ...assignments.defaultAssignment,
          geostore: assignments.geostore.id,
          name: 'name',
          monitors: [ROLES.USER.id],
          createdBy: ROLES.ADMIN.id,
        });

      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const response = await request(app.getHttpServer())
        .patch(`/assignments/${assignment.insertedId.toString()}`)
        .attach('image', fileData, filename)
        .set('Authorization', 'ADMIN')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'image',
        `https://s3.amazonaws.com/bucket/folder/uuid.ext`,
      );
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

      await request(app.getHttpServer())
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

      await request(app.getHttpServer())
        .delete(`/assignments/${assignment.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });
  });

  describe('PATCH /assignments/:id/status', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
    });

    it('should fail if no status is given', async () => {
      const assignmentRes = await request(app.getHttpServer())
        .post('/assignments')
        .send({ ...assignments.defaultAssignment, monitors: [ROLES.USER.id] })
        .set('Authorization', 'USER')
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/assignments/${assignmentRes.body.data.id}/status`)
        .send({})
        .set('Authorization', 'USER')
        .expect(400);
    });

    it('should fail if monitor changing from open to completed', async () => {
      const assignmentRes = await request(app.getHttpServer())
        .post('/assignments')
        .send({ ...assignments.defaultAssignment, monitors: [ROLES.USER.id] })
        .set('Authorization', 'MANAGER')
        .expect(201);

      expect(assignmentRes.body.data.attributes.status).toBe(
        AssignmentStatus.OPEN,
      );

      await request(app.getHttpServer())
        .patch(`/assignments/${assignmentRes.body.data.id}/status`)
        .send({ status: AssignmentStatus.COMPLETED })
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should fail if monitor changing from on hold to completed', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/assignments')
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}`)
        .send({ status: AssignmentStatus.ON_HOLD })
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(res2.body.data.attributes.status).toBe(AssignmentStatus.ON_HOLD);

      await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}/status`)
        .send({ status: AssignmentStatus.COMPLETED })
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should fail if monitor changing from completed to on hold', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/assignments')
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}`)
        .send({ status: AssignmentStatus.COMPLETED })
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(res2.body.data.attributes.status).toBe(AssignmentStatus.COMPLETED);

      await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}/status`)
        .send({ status: AssignmentStatus.ON_HOLD })
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should fail if monitor changing from completed to open', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/assignments')
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}`)
        .send({ status: AssignmentStatus.COMPLETED })
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(res2.body.data.attributes.status).toBe(AssignmentStatus.COMPLETED);

      await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}/status`)
        .send({ status: AssignmentStatus.OPEN })
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should allow monitor to change from open to on hold', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/assignments')
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      expect(res1.body.data.attributes.status).toBe(AssignmentStatus.OPEN);

      await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}/status`)
        .send({ status: AssignmentStatus.ON_HOLD })
        .set('Authorization', 'USER')
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/assignments/${res1.body.data.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data.attributes.status).toBe(
        AssignmentStatus.ON_HOLD,
      );
    });

    it('should allow monitor to change from on hold to open', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/assignments')
        .send({
          ...assignments.defaultAssignment,
          monitors: [ROLES.USER.id],
        })
        .set('Authorization', 'MANAGER')
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}`)
        .send({ status: AssignmentStatus.ON_HOLD })
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(res2.body.data.attributes.status).toBe(AssignmentStatus.ON_HOLD);

      await request(app.getHttpServer())
        .patch(`/assignments/${res1.body.data.id}/status`)
        .send({ status: AssignmentStatus.OPEN })
        .set('Authorization', 'USER')
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/assignments/${res1.body.data.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data.attributes.status).toBe(AssignmentStatus.OPEN);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
