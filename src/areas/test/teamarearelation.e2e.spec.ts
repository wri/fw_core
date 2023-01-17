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
import { AreasService } from '../services/areas.service';
import { AreasModule } from '../modules/areas.module';
import { CoverageService } from '../services/coverage.service';
import { DatasetService } from '../services/dataset.service';
import { GeostoreService } from '../services/geostore.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import constants from './area.constants';
import { ResponseService } from '../services/response.service';
import { TemplatesService } from '../../templates/templates.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';

describe('Area Team Relations', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let apiDbConnection: Connection;
  let formsDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (_id) => 'Full Name',
  };
  const areaService = {
    getUserAreas: (_id) => [constants.testArea],
    getArea: (id) => {
      if (id === constants.testArea.id) return constants.testArea;
      else return null;
    },
    getAreaMICROSERVICE: (id) => {
      if (id === constants.testArea.id) return constants.testArea;
      else return null;
    },
    delete: (_id) => constants.testArea,
  };
  const coverageService = {
    getCoverage: (_params, _token) => {
      return { layers: [] };
    },
  };
  const geostoreService = {
    getGeostore: (_id, _token) => constants.testGeostore,
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

  describe('POST /arearelations/teams', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await apiDbConnection.collection('areateamrelations').deleteMany({});
      await apiDbConnection.collection('areatemplaterelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .post(`/arearelations/teams`)
        .expect(401);
    });

    it('should create a relation', async () => {
      const team = await teamsDbConnection.collection('gfwteams').insertOne({
        name: 'name',
      });
      await request(app.getHttpServer())
        .post(`/arearelations/teams`)
        .set('Authorization', `USER`)
        .send([
          {
            areaId: constants.testArea.id.toString(),
            teamId: team.insertedId.toString(),
          },
        ])
        .expect(201);

      const relation = await apiDbConnection
        .collection('teamarearelation')
        .findOne({
          areaId: constants.testArea.id.toString(),
          teamId: team.insertedId.toString(),
        });
      expect(relation).toBeDefined();
    });

    it('should fail if the area doesnt exist', async () => {
      const team = await teamsDbConnection.collection('gfwteams').insertOne({
        name: 'name',
      });
      await request(app.getHttpServer())
        .post(`/arearelations/teams`)
        .set('Authorization', `USER`)
        .send([
          {
            areaId: constants.testTeamArea.id.toString(),
            teamId: team.insertedId.toString(),
          },
        ])
        .expect(404);
    });

    it('should fail if the team doesnt exist', async () => {
      await request(app.getHttpServer())
        .post(`/arearelations/teams`)
        .set('Authorization', `USER`)
        .send([
          {
            areaId: constants.testTeamArea.id.toString(),
            teamId: constants.testTeamArea.id.toString(),
          },
        ])
        .expect(404);
    });

    it('should fail if the relation already exists', async () => {
      const team = await teamsDbConnection.collection('gfwteams').insertOne({
        name: 'name',
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        areaId: constants.testArea.id.toString(),
        teamId: team.insertedId.toString(),
      });
      await request(app.getHttpServer())
        .post(`/arearelations/teams`)
        .set('Authorization', `USER`)
        .send([
          {
            areaId: constants.testArea.id.toString(),
            teamId: team.insertedId.toString(),
          },
        ])
        .expect(400);
    });
  });

  describe('DELETE /arearelations/teams', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
      await apiDbConnection.collection('areateamrelations').deleteMany({});
      await apiDbConnection.collection('areatemplaterelations').deleteMany({});
      await formsDbConnection.collection('reports').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/arearelations/teams`)
        .expect(401);
    });

    it('should delete a relation', async () => {
      const team = await teamsDbConnection.collection('gfwteams').insertOne({
        name: 'name',
      });
      await apiDbConnection.collection('areateamrelations').insertOne({
        areaId: constants.testArea.id.toString(),
        teamId: team.insertedId.toString(),
      });
      await request(app.getHttpServer())
        .delete(`/arearelations/teams`)
        .set('Authorization', `USER`)
        .send({
          areaId: constants.testArea.id.toString(),
          teamId: team.insertedId.toString(),
        })
        .expect(200);

      const relation = await apiDbConnection
        .collection('teamarearelation')
        .findOne({
          areaId: constants.testArea.id.toString(),
          teamId: team.insertedId.toString(),
        });
      expect(relation).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
