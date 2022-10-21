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
import { AreasService } from '../services/areas.service';
import { AreasModule } from '../modules/areas.module';
import { CoverageService } from '../services/coverage.service';
import { DatasetService } from '../services/dataset.service';
import { GeostoreService } from '../services/geostore.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import constants from './area.constants';
import { ResponseService } from '../services/response.service';
import { ETemplateStatus } from '../../templates/models/template.schema';
import { TemplatesService } from '../../templates/templates.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';

describe('Area Template Relations', () => {
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
    getArea: (id) => {
      if (id === constants.testArea.id) return constants.testArea;
      else return null;
    },
    getAreaMICROSERVICE: (id) => {
      if (id === constants.testArea.id) return constants.testArea;
      else return null;
    },
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

  describe('POST /arearelations/templates', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await apiDbConnection.collection('areateamrelations').deleteMany({});
      await apiDbConnection.collection('areatemplaterelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .post(`/arearelations/templates`)
        .expect(401);
    });

    it('should create a relation', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      await request(app.getHttpServer())
        .post(`/arearelations/templates`)
        .set('Authorization', `USER`)
        .send({
          areaId: constants.testArea.id.toString(),
          templateId: template.insertedId.toString(),
        })
        .expect(201);

      const relation = await apiDbConnection
        .collection('templatearearelation')
        .findOne({
          areaId: constants.testArea.id.toString(),
          templateId: template.insertedId.toString(),
        });
      expect(relation).toBeDefined();
    });

    it('should fail if the area doesnt exist', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      await request(app.getHttpServer())
        .post(`/arearelations/templates`)
        .set('Authorization', `USER`)
        .send({
          areaId: constants.testTeamArea.id.toString(),
          templateId: template.insertedId.toString(),
        })
        .expect(404);
    });

    it('should fail if the template doesnt exist', async () => {
      await request(app.getHttpServer())
        .post(`/arearelations/templates`)
        .set('Authorization', `USER`)
        .send({
          areaId: constants.testTeamArea.id.toString(),
          templateId: constants.testTeamArea.id.toString(),
        })
        .expect(404);
    });

    it('should fail if the relation already exists', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      await apiDbConnection.collection('areatemplaterelations').insertOne({
        areaId: constants.testArea.id.toString(),
        templateId: template.insertedId.toString(),
      });
      await request(app.getHttpServer())
        .post(`/arearelations/templates`)
        .set('Authorization', `USER`)
        .send({
          areaId: constants.testArea.id.toString(),
          templateId: template.insertedId.toString(),
        })
        .expect(400);
    });
  });

  describe('DELETE /arearelations/templates', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await apiDbConnection.collection('areateamrelations').deleteMany({});
      await apiDbConnection.collection('areatemplaterelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/arearelations/templates`)
        .expect(401);
    });

    it('should delete a relation', async () => {
      const template = await formsDbConnection.collection('reports').insertOne({
        name: 'name',
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        public: true,
        status: ETemplateStatus.PUBLISHED,
        questions: [],
      });
      await apiDbConnection.collection('areatemplaterelations').insertOne({
        areaId: constants.testArea.id.toString(),
        templateId: template.insertedId.toString(),
      });
      await request(app.getHttpServer())
        .delete(`/arearelations/templates`)
        .set('Authorization', `USER`)
        .send({
          areaId: constants.testArea.id.toString(),
          templateId: template.insertedId.toString(),
        })
        .expect(200);

      const relation = await apiDbConnection
        .collection('templatearearelation')
        .findOne({
          areaId: constants.testArea.id.toString(),
          templateId: template.insertedId.toString(),
        });
      expect(relation).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
