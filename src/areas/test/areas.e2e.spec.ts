// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserService } from '../../common/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
import { AreasService } from '../services/areas.service';
import { AreasModule } from '../modules/areas.module';
import { CoverageService } from '../services/coverage.service';
import { DatasetService } from '../services/dataset.service';
import { GeostoreService } from '../services/geostore.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TeamAreaRelation } from '../models/teamAreaRelation.schema';
import { TemplateAreaRelation } from '../models/templateAreaRelation.schema';
import constants from './area.constants';
import { ResponseService } from '../services/response.service';
import {
  EMemberRole,
  EMemberStatus,
  TeamMember,
} from '../../teams/models/teamMember.schema';
import { Team } from '../../teams/models/team.schema';
import {
  Template,
  ETemplateStatus,
} from '../../templates/models/template.schema';
import { TemplatesService } from '../../templates/templates.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import mongoose from 'mongoose';

describe('Areas', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (id) => 'Full Name',
  };
  const areaService = {
    getUserAreas: (id) => [constants.testArea],
    getArea: (id) => constants.testArea,
    getAreaMICROSERVICE: (id) => constants.testArea,
    delete: (id) => constants.testArea,
  };
  const coverageService = {
    getCoverage: (params, token) => {
      return { layers: [] };
    },
  };
  const geostoreService = {
    getGeostore: (id, token) => constants.testGeostore,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, AreasModule],
      providers: [
        AreasService,
        UserService,
        DatabaseService,
        CoverageService,
        DatasetService,
        GeostoreService,
        ResponseService,
        TeamsService,
        TeamMembersService,
        TemplatesService,
        TeamAreaRelationService,
        TemplateAreaRelationService,
        {
          provide: getModelToken('areateamrelations', 'apiDb'),
          useValue: jest.fn(),
        },
        {
          provide: getModelToken('areatemplaterelations', 'apiDb'),
          useValue: jest.fn(),
        },
        { provide: getModelToken('gfwteams', 'teamsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('teamuserrelations', 'teamsDb'),
          useValue: jest.fn(),
        },
        { provide: getModelToken('reports', 'formsDb'), useValue: jest.fn() },
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .overrideProvider(AreasService)
      .useValue(areaService)
      .overrideProvider(CoverageService)
      .useValue(coverageService)
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

  describe('GET /areas/user', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await apiDbConnection.collection('areateamrelations').deleteMany({});
      await apiDbConnection.collection('areatemplaterelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).get(`/areas/user`).expect(401);
    });

    it('should return an array of areas', async () => {
      const response = await request(app.getHttpServer())
        .get(`/areas/user`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id', constants.testArea.id);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('geostore');
      expect(response.body.data[0].attributes.geostore).toHaveProperty(
        'id',
        constants.testGeostore.id,
      );
    });

    it('should fail with a 503 if the wrong data is received', async () => {
      return await request(app.getHttpServer())
        .get(`/areas/user`)
        .set('Authorization', 'ADMIN')
        .expect(503);
    });

    it('should contain an array of report templates linked with the area', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      const templateAreaRelation = await apiDbConnection
        .collection('areatemplaterelations')
        .insertOne({
          areaId: constants.testArea.id,
          templateId: template.insertedId.toString(),
        });
      const response = await request(app.getHttpServer())
        .get(`/areas/user`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data[0].id).toEqual(constants.testArea.id);
      expect(response.body.data[0].attributes).toHaveProperty('reportTemplate');
      expect(response.body.data[0].attributes.reportTemplate[0]).toHaveProperty(
        '_id',
        template.insertedId.toString(),
      );
    });

    it('should contain an array of report templates that always have public reports in', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      const response = await request(app.getHttpServer())
        .get(`/areas/user`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data[0].id).toEqual(constants.testArea.id);
      expect(response.body.data[0].attributes).toHaveProperty('reportTemplate');
      expect(response.body.data[0].attributes.reportTemplate[0]).toHaveProperty(
        '_id',
        template.insertedId.toString(),
      );
    });

    it('should contain an array of teams linked with the area', async () => {
      const team1 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      const relation = await apiDbConnection
        .collection('areateamrelations')
        .insertOne({ areaId: constants.testArea.id, teamId: team1.insertedId });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team1.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      const response = await request(app.getHttpServer())
        .get(`/areas/user`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data[0].id).toEqual(constants.testArea.id);
      expect(response.body.data[0].attributes).toHaveProperty('teams');
      expect(response.body.data[0].attributes.teams[0]).toHaveProperty(
        'id',
        team1.insertedId.toString(),
      );
    });
  });

  describe('GET /areas/userAndTeam', () => {
    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/areas/userAndTeam`)
        .expect(401);
    });

    it('should return an array of areas', async () => {
      const team1 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team1.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Invited,
        role: EMemberRole.Administrator,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        areaId: constants.testArea.id,
        teamId: team1.insertedId.toString(),
      });

      const response = await request(app.getHttpServer())
        .get(`/areas/userAndTeam`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
    });

    it('should fail with a 503 if the wrong data is received', async () => {
      return await request(app.getHttpServer())
        .get(`/areas/userAndTeam`)
        .set('Authorization', 'ADMIN')
        .expect(503);
    });

    it('should contain an array of report templates that always have public reports in', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      const response = await request(app.getHttpServer())
        .get(`/areas/userAndTeam`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data[0].id).toEqual(constants.testArea.id);
      expect(response.body.data[0].attributes).toHaveProperty('reportTemplate');
      expect(response.body.data[0].attributes.reportTemplate[0]).toHaveProperty(
        '_id',
        template.insertedId.toString(),
      );
    });
  });

  describe('POST /areas', () => {
    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).post(`/areas`).expect(401);
    });

    it('Create an area while being logged without a name value should return an error', async function () {
      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const response = await request(app.getHttpServer())
        .post(`/areas`)
        .attach('image', fileData, filename)
        .set('Authorization', `USER`)
        .expect(400);
    });

    it('Create an area while being logged without a geojson value should return an error', async function () {
      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const response = await request(app.getHttpServer())
        .post(`/areas`)
        .attach('image', fileData, filename)
        .field({ name: 'name' })
        .set('Authorization', `USER`)
        .expect(400);
    });
    it('Create an area while being logged without an image value should return an error', async function () {
      const response = await request(app.getHttpServer())
        .post(`/areas`)
        .send({ name: 'name', geojson: {} })
        .set('Authorization', `USER`)
        .expect(400);
    });
  });

  describe('GET /areas/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await apiDbConnection.collection('areateamrelations').deleteMany({});
      await apiDbConnection.collection('areatemplaterelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).get(`/areas/${1}`).expect(401);
    });

    it('should return the area if the user owns it', async () => {
      const response = await request(app.getHttpServer())
        .get(`/areas/${constants.testArea.id}`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data.id).toEqual(constants.testArea.id);
    });

    it('should return the area if the user is in a team with the area linked', async () => {
      const team1 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team1.insertedId.toString(),
        userId: ROLES.ADMIN.id,
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        areaId: constants.testArea.id,
        teamId: team1.insertedId.toString(),
      });
      const response = await request(app.getHttpServer())
        .get(`/areas/${constants.testArea.id}`)
        .set('Authorization', `ADMIN`)
        .expect(200);

      expect(response.body.data.id).toEqual(constants.testArea.id);
    });

    it('should contain an array of report templates linked with the area', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      const templateAreaRelation = await apiDbConnection
        .collection('areatemplaterelations')
        .insertOne({
          areaId: constants.testArea.id,
          templateId: template.insertedId.toString(),
        });
      const response = await request(app.getHttpServer())
        .get(`/areas/${constants.testArea.id}`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data.id).toEqual(constants.testArea.id);
      expect(response.body.data.attributes).toHaveProperty('reportTemplate');
      expect(response.body.data.attributes.reportTemplate[0]).toHaveProperty(
        '_id',
        template.insertedId.toString(),
      );
    });

    it('should contain an array of teams linked with the area', async () => {
      const team1 = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      const relation = await apiDbConnection
        .collection('areateamrelations')
        .insertOne({ areaId: constants.testArea.id, teamId: team1.insertedId });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team1.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      const response = await request(app.getHttpServer())
        .get(`/areas/${constants.testArea.id}`)
        .set('Authorization', `USER`)
        .expect(200);

      expect(response.body.data.id).toEqual(constants.testArea.id);
      expect(response.body.data.attributes).toHaveProperty('teams');
      expect(response.body.data.attributes.teams[0]).toHaveProperty(
        'id',
        team1.insertedId.toString(),
      );
    });
  });

  describe('PATCH /areas/:id', () => {
    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .patch(`/areas/${1}`)
        .expect(401);
    });

    it('Update an area while being logged without a name value should return an error', async function () {
      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const response = await request(app.getHttpServer())
        .patch(`/areas/${1}`)
        .attach('image', fileData, filename)
        .set('Authorization', `USER`)
        .expect(400);
    });

    it('Update an area while being logged without a geojson value should return an error', async function () {
      const filename = 'image.png';
      const fileData = Buffer.from('TestFileContent', 'utf8');

      const response = await request(app.getHttpServer())
        .patch(`/areas/${1}`)
        .attach('image', fileData, filename)
        .field({ name: 'name' })
        .set('Authorization', `USER`)
        .expect(400);
    });
    it('Update an area while being logged without an image value should return an error', async function () {
      const response = await request(app.getHttpServer())
        .patch(`/areas/${1}`)
        .send({ name: 'name', geojson: {} })
        .set('Authorization', `USER`)
        .expect(400);
    });
  });

  describe('DELETE /areas/:id', () => {
    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/areas/${constants.testArea.toString()}`)
        .expect(401);
    });

    it("should fail when deleting another user's area", async function () {
      return await request(app.getHttpServer())
        .delete(`/areas/${constants.testArea.id.toString()}`)
        .set('Authorization', `ADMIN`)
        .expect(401);
    });

    it('should succeed when deleting own area', async function () {
      const response = await request(app.getHttpServer())
        .delete(`/areas/${constants.testArea.id.toString()}`)
        .set('Authorization', `USER`)
        .expect(200);
    });

    it('should delete all team relations', async function () {
      const relation = await apiDbConnection
        .collection('areateamrelations')
        .insertOne({
          areaId: constants.testArea.id,
          teamId: new mongoose.Types.ObjectId(),
        });
      const response = await request(app.getHttpServer())
        .delete(`/areas/${constants.testArea.id.toString()}`)
        .set('Authorization', `USER`)
        .expect(200);

      const deletedRelation = await apiDbConnection
        .collection('areateamrelations')
        .findOne({ areaId: constants.testArea.id });
      expect(deletedRelation).toBeNull();
    });

    it('should delete all template relations', async function () {
      const relation = await apiDbConnection
        .collection('areatemplaterelations')
        .insertOne({
          areaId: constants.testArea.id,
          templateId: new mongoose.Types.ObjectId(),
        });
      const response = await request(app.getHttpServer())
        .delete(`/areas/${constants.testArea.id.toString()}`)
        .set('Authorization', `USER`)
        .expect(200);

      const deletedRelation = await apiDbConnection
        .collection('areatemplaterelations')
        .findOne({ areaId: constants.testArea.id });
      expect(deletedRelation).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
