// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest'
import { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing";
import { TeamsService } from "../../teams/services/teams.service";
import { UserService } from '../../common/user.service';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import mongoose from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
import { AreasService } from '../services/areas.service';
import { AreasModule } from '../modules/areas.module';
import { CoverageService } from '../services/coverage.service';
import { DatasetService } from '../services/dataset.service';
import { GeostoreService } from '../services/geostore.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TeamsModule } from '../../teams/modules/teams.module';
import { TeamMembersModule } from '../../teams/modules/teamMembers.module';
import { TeamAreaRelation } from '../models/teamAreaRelation.schema';
import { TemplateAreaRelation } from '../models/templateAreaRelation.schema';

import constants from './area.constants'
import { ResponseService } from '../services/response.service';
import { EMemberRole, EMemberStatus, TeamMember } from '../../teams/models/teamMember.schema';
import { Team } from '../../teams/models/team.schema';

// @ts-ignore
describe('Areas', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (id) => 'Full Name'
  }
  let areaService = {
    getUserAreas: (id) => [constants.testArea],
    getAreaMICROSERVICE: (id) => constants.testTeamArea
  }
  let coverageService = {
    getCoverage: (params, token) => {
      return {layers: []}
    }
  }
  let geostoreService = {
    getGeostore: (id, token) => constants.testGeostore
  }

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
        TeamAreaRelationService,
        TemplateAreaRelationService,
        {provide: getModelToken(TeamAreaRelation.name), useValue: jest.fn()},
        {provide: getModelToken(TemplateAreaRelation.name), useValue: jest.fn()},
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
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
    dbConnection = moduleRef.get<DatabaseService>(DatabaseService).getDbHandle();
  });

  describe('GET /areas/user', () => {

    afterEach(async () => {
      await dbConnection.collection('teams').deleteMany({});
      await dbConnection.collection('teammembers').deleteMany({});
      await dbConnection.collection('teamarearelations').deleteMany({});
      await dbConnection.collection('templatememberrelations').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/forest-watcher/areas/user`)
      .expect(401)
    });

    it('should return an array of areas', async () => {
      const response = await request(app.getHttpServer())
      .get(`/forest-watcher/areas/user`)
      .set('Authorization', 'USER')
      .expect(200)


      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id', constants.testArea.id);
      expect(response.body.data[0]).toHaveProperty('attributes')
      expect(response.body.data[0].attributes).toHaveProperty('geostore')
      expect(response.body.data[0].attributes.geostore).toHaveProperty('id', constants.testGeostore.id)
    });

    it('should fail with a 503 if the wrong data is received', async () => {
      return await request(app.getHttpServer())
        .get(`/forest-watcher/areas/user`)
        .set('Authorization', 'ADMIN')
        .expect(503)
    })
  });

  describe('GET /areas/userAndTeam', () => {

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/forest-watcher/areas/userAndTeam`)
      .expect(401)
    });

    it('should return an array of areas', async () => {

    const team1 = await dbConnection.collection('teams').insertOne({name: 'Test'});
    await dbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Administrator})
    await dbConnection.collection('teamarearelations').insertOne({areaId: constants.testTeamArea.id, teamId: team1.insertedId.toString()})

    const response = await request(app.getHttpServer())
      .get(`/forest-watcher/areas/userAndTeam`)
      .set('Authorization', 'USER')
      .expect(200)
    
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
    });

    it('should fail with a 503 if the wrong data is received', async () => {
      return await request(app.getHttpServer())
        .get(`/forest-watcher/areas/userAndTeam`)
        .set('Authorization', 'ADMIN')
        .expect(503)
    })

  });

  afterAll(async () => {

    await app.close();
  })
});