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
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';
import { TemplateAreaRelationService } from '../../areas/services/templateAreaRelation.service';
import { TemplatesService } from '../../templates/templates.service';
import { AnswersService } from '../../answers/services/answers.service';
import { Answer } from '../../answers/models/answer.model';
import routeConstants from './routes.constants';
import areaConstants from '../../areas/test/area.constants';
import { S3Service } from '../../answers/services/s3Service';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import { AreasService } from '../../areas/services/areas.service';
import { CoverageService } from '../../areas/services/coverage.service';
import { DatasetService } from '../../areas/services/dataset.service';
import { RoutesService } from '../routes.service';
import { Route } from '../models/route.schema';

describe('Routes', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let formsDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (_id) => 'Full Name',
  };
  const areaService = {
    getAreaMICROSERVICE: (id) => {
      if (id === areaConstants.testArea.id) return areaConstants.testArea;
      else return null;
    },
  };
  const s3Service = {
    uploadFile: (_file, _name) =>
      `https://s3.amazonaws.com/bucket/folder/uuid.ext`,
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
        CoverageService,
        DatasetService,
        S3Service,
        RoutesService,
        { provide: getModelToken('gfwteams', 'teamsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('teamuserrelations', 'teamsDb'),
          useValue: jest.fn(),
        },
        { provide: getModelToken('reports', 'formsDb'), useValue: jest.fn() },
        { provide: getModelToken(Answer.name, 'formsDb'), useValue: jest.fn() },
        { provide: getModelToken(Route.name, 'formsDb'), useValue: jest.fn() },
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
      .overrideProvider(AreasService)
      .useValue(areaService)
      .overrideProvider(S3Service)
      .useValue(s3Service)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    teamsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getTeamsHandle();
    formsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getFormsHandle();
  });

  describe('POST /routes/sync', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
      await formsDbConnection.collection('routes').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .post(`/routes/sync`)
        .expect(401);
    });

    it('should create routes', async () => {
      await request(app.getHttpServer())
        .post(`/routes/sync`)
        .send([
          {
            ...routeConstants.defaultRoute,
            id: 'cea34015-bfaf-46c2-a660-db1e9819b515',
            teamId: new mongoose.Types.ObjectId(),
          },
          {
            ...routeConstants.defaultRoute,
            teamId: new mongoose.Types.ObjectId(),
            id: 'cea34015-bfaf-46c2-a660-db1e9819b516',
          },
        ])
        .set('Authorization', 'USER')
        .expect(201);

      const createdRoutes = await formsDbConnection
        .collection('routes')
        .count({ createdBy: ROLES.USER.id });
      expect(createdRoutes).toBeDefined();
      expect(createdRoutes).toBe(2);
    });

    it('should return created routes', async () => {
      const response = await request(app.getHttpServer())
        .post(`/routes/sync`)
        .send([
          {
            ...routeConstants.defaultRoute,
            id: 'cea34015-bfaf-46c2-a660-db1e9819b515',
            teamId: new mongoose.Types.ObjectId(),
          },
          {
            ...routeConstants.defaultRoute,
            teamId: new mongoose.Types.ObjectId(),
            id: 'cea34015-bfaf-46c2-a660-db1e9819b516',
          },
        ])
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('name', 'route');
      expect(response.body.data[1]).toHaveProperty('attributes');
      expect(response.body.data[1].attributes).toHaveProperty('locations');
      expect(response.body.data[1].attributes.locations.length).toBe(5);
      expect(response.body.data[1].attributes.locations[0]).toHaveProperty(
        'accuracy',
        5,
      );
    });

    it('should add createdBy, routeId, active fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/routes/sync`)
        .send([
          {
            ...routeConstants.defaultRoute,
            id: 'cea34015-bfaf-46c2-a660-db1e9819b515',
            teamId: new mongoose.Types.ObjectId(),
          },
          {
            ...routeConstants.defaultRoute,
            teamId: new mongoose.Types.ObjectId(),
            id: 'cea34015-bfaf-46c2-a660-db1e9819b516',
          },
        ])
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty(
        'createdBy',
        ROLES.USER.id,
      );
      expect(response.body.data[1]).toHaveProperty('attributes');
      expect(response.body.data[1].attributes).toHaveProperty(
        'routeId',
        'cea34015-bfaf-46c2-a660-db1e9819b516',
      );
      expect(response.body.data[1].attributes).toHaveProperty('active', true);
      expect(response.body.data[0].attributes).not.toHaveProperty('id');

      const route1 = await formsDbConnection.collection('routes').findOne({
        _id: new mongoose.Types.ObjectId(response.body.data[0].id),
      });
      expect(route1).toBeDefined();
      expect(route1).toHaveProperty('active', true);
      expect(route1).toHaveProperty(
        'routeId',
        'cea34015-bfaf-46c2-a660-db1e9819b515',
      );
      expect(route1).not.toHaveProperty('id');
    });

    it('should only sync and return unsynced routes', async () => {
      await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.USER.id,
        active: true,
      });

      const response = await request(app.getHttpServer())
        .post(`/routes/sync`)
        .send([
          {
            ...routeConstants.defaultRoute,
            id: 'cea34015-bfaf-46c2-a660-db1e9819b515',
            teamId: new mongoose.Types.ObjectId(),
          },
          {
            ...routeConstants.defaultRoute,
            teamId: new mongoose.Types.ObjectId(),
            id: 'cea34015-bfaf-46c2-a660-db1e9819b516',
          },
        ])
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty(
        'routeId',
        'cea34015-bfaf-46c2-a660-db1e9819b516',
      );
    });

    it('should not create route if route id is mongo id existing in db', async () => {
      const route = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'e21bbd78-44c9-4d1f-9db2-324ab3def41b',
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.USER.id,
        active: true,
      });

      const response = await request(app.getHttpServer())
        .post(`/routes/sync`)
        .send([
          {
            ...routeConstants.defaultRoute,
            id: 'cea34015-bfaf-46c2-a660-db1e9819b515',
            teamId: new mongoose.Types.ObjectId(),
          },
          {
            ...routeConstants.defaultRoute,
            teamId: new mongoose.Types.ObjectId(),
            id: route.insertedId.toString(),
          },
        ])
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].attributes.routeId).toBe(
        'cea34015-bfaf-46c2-a660-db1e9819b515',
      );
    });
  });

  describe('GET /routes/user', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
      await formsDbConnection.collection('routes').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).get(`/routes/user`).expect(401);
    });

    it('should return an array of all the users routes', async () => {
      const routes = await formsDbConnection.collection('routes').insertMany([
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
          teamId: new mongoose.Types.ObjectId(),
          createdBy: ROLES.USER.id,
          active: true,
        },
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b516',
          teamId: new mongoose.Types.ObjectId(),
          createdBy: ROLES.MANAGER.id,
          active: true,
        },
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b517',
          teamId: new mongoose.Types.ObjectId(),
          createdBy: ROLES.USER.id,
          active: true,
        },
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b517',
          teamId: new mongoose.Types.ObjectId(),
          createdBy: ROLES.USER.id,
          active: false,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/routes/user`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body.data).toHaveLength(2);

      const routeIds = [routes.insertedIds[0], routes.insertedIds[2]].map(
        (id) => id.toString(),
      );

      expect(response.body.data.map((d) => d.id).sort()).toEqual(
        routeIds.sort(),
      );
    });
  });

  describe('GET /routes/teams', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
      await formsDbConnection.collection('routes').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/routes/teams`)
        .expect(401);
    });

    it('should return an array of all routes for teams the user is a member of', async () => {
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

      const routes = await formsDbConnection.collection('routes').insertMany([
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
          teamId: team.insertedId.toString(),
          createdBy: ROLES.USER.id,
          active: true,
        },
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b516',
          teamId: new mongoose.Types.ObjectId(),
          createdBy: ROLES.ADMIN.id,
          active: true,
        },
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b517',
          teamId: team.insertedId.toString(),
          createdBy: ROLES.USER.id,
          active: true,
        },
        {
          ...routeConstants.defaultRoute,
          routeId: 'cea34015-bfaf-46c2-a660-db1e9819b517',
          teamId: team.insertedId.toString(),
          createdBy: ROLES.USER.id,
          active: false,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/routes/teams`)
        .set('Authorization', 'MANAGER')
        .expect(200);

      expect(response.body.data).toHaveLength(2);

      const routeIds = [routes.insertedIds[0], routes.insertedIds[2]].map(
        (id) => id.toString(),
      );

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((d) => d.id).sort()).toEqual(
        routeIds.sort(),
      );
    });
  });

  describe('GET /routes/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
      await formsDbConnection.collection('routes').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).get(`/routes/${1}`).expect(401);
    });

    it('should return a route', async () => {
      const route1 = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.USER.id,
        active: true,
      });
      const response = await request(app.getHttpServer())
        .get(`/routes/${route1.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        route1.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'createdBy',
        ROLES.USER.id,
      );
    });

    it('should add username to route', async () => {
      const route1 = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.USER.id,
        active: true,
      });
      const response = await request(app.getHttpServer())
        .get(`/routes/${route1.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        route1.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty(
        'username',
        'Full Name',
      );
    });
  });

  describe('DELETE /routes/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
      await formsDbConnection.collection('routes').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/routes/${1}`)
        .expect(401);
    });

    it('should hard delete the route if deleted by creator', async () => {
      const route1 = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.USER.id,
        active: true,
      });
      await request(app.getHttpServer())
        .delete(`/routes/${route1.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      const deactivated = await formsDbConnection
        .collection('routes')
        .findOne({ routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515' });
      expect(deactivated).toBeNull();
    });

    it('should allow a team manager to deactivate a team route', async () => {
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

      const route1 = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: team.insertedId.toString(),
        createdBy: ROLES.USER.id,
        active: true,
      });
      await request(app.getHttpServer())
        .delete(`/routes/${route1.insertedId.toString()}`)
        .set('Authorization', 'MANAGER')
        .expect(200);

      const deactivated = await formsDbConnection
        .collection('routes')
        .findOne({ _id: route1.insertedId });
      expect(deactivated).toBeDefined();
      expect(deactivated).toHaveProperty('active', false);
    });

    it('should fail if user is not creator or manager', async () => {
      const route1 = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.USER.id,
        active: true,
      });
      await request(app.getHttpServer())
        .delete(`/routes/${route1.insertedId.toString()}`)
        .set('Authorization', 'MANAGER')
        .expect(403);
    });

    it('should fail if route doesnt exist', async () => {
      const route1 = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .delete(`/routes/${route1.toString()}`)
        .set('Authorization', 'MANAGER')
        .expect(404);
    });
  });

  describe('GET /routes/team/:teamId/area/:areaId', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
      await formsDbConnection.collection('answers').deleteMany({});
      await formsDbConnection.collection('assignments').deleteMany({});
      await formsDbConnection.collection('routes').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/routes/team/${1}/area/${1}`)
        .expect(401);
    });

    it('should return an array of active routes the user has created and team routes for the given team and area id', async () => {
      const areaId = new mongoose.Types.ObjectId();
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

      const areaTeam = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b515',
        teamId: team.insertedId.toString(),
        areaId: areaId.toString(),
        createdBy: ROLES.ADMIN.id,
        active: true,
      });

      await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b516',
        areaId: areaId.toString(),
        teamId: new mongoose.Types.ObjectId(),
        createdBy: ROLES.ADMIN.id,
        active: true,
      });

      const areaUser = await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b517',
        teamId: new mongoose.Types.ObjectId(),
        areaId: areaId.toString(),
        createdBy: ROLES.USER.id,
        active: true,
      });

      await formsDbConnection.collection('routes').insertOne({
        ...routeConstants.defaultRoute,
        routeId: 'cea34015-bfaf-46c2-a660-db1e9819b517',
        teamId: team.insertedId.toString(),
        createdBy: ROLES.USER.id,
        active: false,
      });

      const response = await request(app.getHttpServer())
        .get(
          `/routes/team/${team.insertedId.toString()}/area/${areaId.toString()}`,
        )
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        areaTeam.insertedId.toString(),
      );
      expect(response.body.data[1]).toHaveProperty(
        'id',
        areaUser.insertedId.toString(),
      );
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
