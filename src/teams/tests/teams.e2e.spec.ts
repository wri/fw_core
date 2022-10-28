// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TeamsService } from '../services/teams.service';
import { UserService } from '../../common/user.service';
import { TeamMembersService } from '../services/teamMembers.service';
import { getModelToken } from '@nestjs/mongoose';
import { EMemberRole, EMemberStatus } from '../models/teamMember.schema';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
import { TeamsModule } from '../modules/teams.module';
import { TeamAreaRelationService } from '../../areas/services/teamAreaRelation.service';
import mongoose from 'mongoose';

describe('Teams', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  const userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (_id) => 'Full Name',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, TeamsModule],
      providers: [
        TeamsService,
        UserService,
        TeamMembersService,
        DatabaseService,
        TeamAreaRelationService,
        { provide: getModelToken('gfwteams', 'teamsDb'), useValue: jest.fn() },
        {
          provide: getModelToken('teamuserrelations', 'teamsDb'),
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
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    teamsDbConnection = moduleRef
      .get<DatabaseService>(DatabaseService)
      .getTeamsHandle();
  });

  describe('GET /teams/myinvites', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/teams/myinvites`)
        .expect(401);
    });

    it('should return an array of teams', async () => {
      // add a team
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test2' });
      // add an invited user
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Invited,
      });
      const response = await request(app.getHttpServer())
        .get(`/teams/myinvites`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        team.insertedId.toString(),
      );
    });
  });

  describe('GET /teams/:teamId', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      const doc = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      return await request(app.getHttpServer())
        .get(`/teams/${doc.insertedId}`)
        .expect(401);
    });

    it('should return a team', async () => {
      const doc = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      const response = await request(app.getHttpServer())
        .get(`/teams/${doc.insertedId}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        doc.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'Test');
    });
  });

  describe('GET /teams/user/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .get(`/teams/user/${ROLES.USER.id}`)
        .expect(401);
    });

    it('should return an array of teams', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test2' });
      // add an invited user
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      const response = await request(app.getHttpServer())
        .get(`/teams/user/${ROLES.USER.id}`)
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty(
        'id',
        team.insertedId.toString(),
      );
    });
  });

  describe('POST /teams', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).post(`/teams`).expect(401);
    });

    it('should return a 400 if no team name supplied', async () => {
      await request(app.getHttpServer())
        .post(`/teams`)
        .send({})
        .set('Authorization', 'USER')
        .expect(400);
    });

    it('should create a new team', async () => {
      await request(app.getHttpServer())
        .post(`/teams`)
        .send({ name: 'New Team' })
        .set('Authorization', 'USER')
        .expect(201);

      const newTeam = teamsDbConnection
        .collection('gfwteams')
        .findOne({ name: 'New Team' });
      expect(newTeam).toBeDefined();
    });

    it('should return the new team', async () => {
      const response = await request(app.getHttpServer())
        .post(`/teams`)
        .send({ name: 'New Team' })
        .set('Authorization', 'USER')
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'New Team');
    });

    it('should create an administrator', async () => {
      const response = await request(app.getHttpServer())
        .post(`/teams`)
        .send({ name: 'New Team' })
        .set('Authorization', 'USER')
        .expect(201);

      const member = await teamsDbConnection
        .collection('teamuserrelations')
        .findOne({
          teamId: new mongoose.Types.ObjectId(response.body.data.id),
          userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        });
      expect(member).toBeDefined();
      expect(member).toHaveProperty('role', EMemberRole.Administrator);
    });
  });

  describe('PATCH /teams/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer()).patch(`/teams/:id`).expect(401);
    });

    it('should return a 403 if the user is not an admin or manager of the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      return await request(app.getHttpServer())
        .patch(`/teams/${team.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should succeed if the user is a manager of the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      await request(app.getHttpServer())
        .patch(`/teams/${team.insertedId.toString()}`)
        .send({ name: 'Update' })
        .set('Authorization', 'USER')
        .expect(200);
    });

    it('should succeed if the user is an admin of the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      await request(app.getHttpServer())
        .patch(`/teams/${team.insertedId.toString()}`)
        .send({ name: 'Update' })
        .set('Authorization', 'USER')
        .expect(200);
    });

    it('should update the record', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      await request(app.getHttpServer())
        .patch(`/teams/${team.insertedId.toString()}`)
        .send({ name: 'Update' })
        .set('Authorization', 'USER')
        .expect(200);

      const updatedTeam = await teamsDbConnection
        .collection('gfwteams')
        .findOne({ _id: team.insertedId });
      expect(updatedTeam?.name).toEqual('Update');
    });

    it('should return the record', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      const response = await request(app.getHttpServer())
        .patch(`/teams/${team.insertedId.toString()}`)
        .send({ name: 'Update' })
        .set('Authorization', 'USER')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty(
        'id',
        team.insertedId.toString(),
      );
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.attributes).toHaveProperty('name', 'Update');
    });
  });

  describe('DELETE /teams/:id', () => {
    afterEach(async () => {
      await teamsDbConnection.collection('gfwteams').deleteMany({});
      await teamsDbConnection.collection('teamuserrelations').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
        .delete(`/teams/:id`)
        .expect(401);
    });

    it('should return a 403 if the user is a monitor of the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Monitor,
      });
      return await request(app.getHttpServer())
        .delete(`/teams/${team.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should return a 403 if the user is a manager of the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Manager,
      });
      await request(app.getHttpServer())
        .delete(`/teams/${team.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(403);
    });

    it('should succeed if the user is an admin of the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      await request(app.getHttpServer())
        .delete(`/teams/${team.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);
    });

    it('should delete the team', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      await request(app.getHttpServer())
        .delete(`/teams/${team.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      const deletedTeam = await teamsDbConnection
        .collection('gfwteams')
        .findOne({ _id: team.insertedId });
      expect(deletedTeam).toBeNull();
    });

    it('should delete all team users', async () => {
      const team = await teamsDbConnection
        .collection('gfwteams')
        .insertOne({ name: 'Test' });
      await teamsDbConnection.collection('teamuserrelations').insertOne({
        teamId: team.insertedId,
        userId: new mongoose.Types.ObjectId(ROLES.USER.id),
        email: ROLES.USER.email,
        status: EMemberStatus.Confirmed,
        role: EMemberRole.Administrator,
      });
      await request(app.getHttpServer())
        .delete(`/teams/${team.insertedId.toString()}`)
        .set('Authorization', 'USER')
        .expect(200);

      const deletedTeamMember = await teamsDbConnection
        .collection('teamuserrelations')
        .findOne({ teamId: team.insertedId });
      expect(deletedTeamMember).toBeNull();
    });
  });

  afterAll(async () => {
    await teamsDbConnection.collection('gfwteams').deleteMany({});
    await teamsDbConnection.collection('teamuserrelations').deleteMany({});

    await app.close();
  });
});
