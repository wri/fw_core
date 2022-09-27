// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import request from 'supertest'
import { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing";
import { TeamsService } from "../services/teams.service";
import { UserService } from '../../common/user.service';
import { TeamMembersService } from '../services/teamMembers.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Team } from '../models/team.schema';
import { EMemberRole, EMemberStatus, TeamMember, TeamMemberSchema } from '../models/teamMember.schema';
import { AppModule } from '../../app.module';
import ROLES from '../../common/testConstants';
import { Connection } from 'mongoose';
import { DatabaseService } from '../../common/database/database.service';
import { TeamsModule } from '../modules/teams.module';

// @ts-ignore
describe('Team Members', () => {
  let app: INestApplication;
  let teamsDbConnection: Connection;
  let userService = {
    authorise: (token) => ROLES[token],
    getNameByIdMICROSERVICE: (id) => 'Full Name'
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, TeamsModule],
      providers: [
        TeamsService, 
        UserService, 
        TeamMembersService,
        DatabaseService,
        {provide: getModelToken(Team.name, 'teamsDb'), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name, 'teamsDb'), useValue: jest.fn()}
      ],
    })
      .overrideProvider(UserService)
      .useValue(userService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    teamsDbConnection = moduleRef.get<DatabaseService>(DatabaseService).getTeamsHandle();
  });

  describe('GET /teams/:teamId/users', () => {
    //jest.setTimeout(10000)
    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    })

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .get(`/teams/${1}/users`)
      .expect(401)
    });

    it('should return a 403 if not a team member', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      return await request(app.getHttpServer())
      .get(`/teams/${team1.insertedId.toString()}/users`)
      .set('Authorization', 'USER')
      .expect(403)
    })

    it('should return an array of team members', async () => {
      // add a team
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const team2 = await teamsDbConnection.collection('teams').insertOne({name: 'Test2'});
      // add an invited user
      const member1 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited})
      const member2 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Invited})
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team2.insertedId.toString(), userId: ROLES.ADMIN.id, email: ROLES.ADMIN.email, status: EMemberStatus.Invited})
      const response = await request(app.getHttpServer())
      .get(`/teams/${team1.insertedId.toString()}/users`)
      .set('Authorization', 'USER')
      .expect(200)
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id', member1.insertedId.toString());
      expect(response.body.data[1]).toHaveProperty('id', member2.insertedId.toString());
    });
  });

  describe('POST /teams/:teamId/users', () => {
    //jest.setTimeout(10000)
    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .post(`/teams/${1}/users`)
      .expect(401)
    });

    it('should return a 403 if not a team member', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      return await request(app.getHttpServer())
      .post(`/teams/${team1.insertedId.toString()}/users`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should return a 403 if a team monitor', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .post(`/teams/${team1.insertedId.toString()}/users`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should return a 403 if a team monitor', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Manager})
      return await request(app.getHttpServer())
      .post(`/teams/${team1.insertedId.toString()}/users`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if a team admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Administrator})
      return await request(app.getHttpServer())
      .post(`/teams/${team1.insertedId.toString()}/users`)
      .send([{    
        teamId: team1.insertedId.toString(),
        userId: ROLES.ADMIN.id,
        email: ROLES.ADMIN.email,
        role: EMemberRole.Monitor
      }])
      .set('Authorization', 'USER')
      .expect(201)
    });

    it('should add a team member record', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Administrator})
      await request(app.getHttpServer())
      .post(`/teams/${team1.insertedId.toString()}/users`)
      .send([{    
        teamId: team1.insertedId.toString(),
        userId: ROLES.ADMIN.id,
        email: ROLES.ADMIN.email,
        role: EMemberRole.Monitor
      }])
      .set('Authorization', 'USER')
      .expect(201)

      const teamMember = await teamsDbConnection.collection('teammembers').findOne({
        teamId: team1.insertedId.toString(),
        userId: ROLES.ADMIN.id,
        email: ROLES.ADMIN.email,
        role: EMemberRole.Monitor
      })
      expect(teamMember).toBeDefined();
    });

    it('should return the saved records', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Administrator})
      const response = await request(app.getHttpServer())
      .post(`/teams/${team1.insertedId.toString()}/users`)
      .send([{    
        teamId: team1.insertedId.toString(),
        userId: ROLES.ADMIN.id,
        email: ROLES.ADMIN.email,
        role: EMemberRole.Monitor
      }])
      .set('Authorization', 'USER')
      .expect(201)

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toEqual(1);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0].attributes).toHaveProperty('email', ROLES.ADMIN.email);
    });

  });

  describe('PATCH /teams/:teamId/users/reassignAdmin/:userId', () => {
    //jest.setTimeout(10000)
    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/teams/${1}/users/reassignAdmin/${2}`)
      .expect(401)
    });

    it('should return a 403 if not a team member', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/reassignAdmin/${2}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should return a 403 if a team monitor', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/reassignAdmin/${2}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should return a 403 if a team monitor', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Manager})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/reassignAdmin/${2}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if a team admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Invited, role: EMemberRole.Manager})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/reassignAdmin/${ROLES.MANAGER.id}`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should make user the team admin and current admin manager', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const adminUser = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Administrator})
      const teamUser = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Invited, role: EMemberRole.Manager})
      await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/reassignAdmin/${ROLES.MANAGER.id}`)
      .set('Authorization', 'USER')
      .expect(200)

      const newAdmin = await teamsDbConnection.collection('teammembers').findOne({'_id': teamUser.insertedId});
      expect(newAdmin.role).toEqual(EMemberRole.Administrator);
      const oldAdmin = await teamsDbConnection.collection('teammembers').findOne({'_id': adminUser.insertedId});
      expect(oldAdmin.role).toEqual(EMemberRole.Manager);

    });

  });

  describe('PATCH /teams/:teamId/users/:memberId', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/teams/${1}/users/${2}`)
      .expect(401)
    });

    it('should return a 403 if not a team member', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${2}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should return a 403 if a team monitor', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${2}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if a team manager', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Manager})
      const member2 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${member2.insertedId.toString()}`)
      .send({role: EMemberRole.Monitor})
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should succeed if a team admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .send({role: EMemberRole.Monitor})
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should fail if updating team admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${admin.insertedId.toString()}`)
      .send({role: EMemberRole.Monitor})
      .set('Authorization', 'USER')
      .expect(400)
    });

    it('should fail if updating invited user', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Invited, role: EMemberRole.Manager})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .send({role: EMemberRole.Monitor})
      .set('Authorization', 'USER')
      .expect(400)
    });

    it('should fail if updating declined user', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Declined, role: EMemberRole.Manager})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .send({role: EMemberRole.Monitor})
      .set('Authorization', 'USER')
      .expect(400)
    });

    it('should fail if updating user to admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Manager})
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .send({role: EMemberRole.Administrator})
      .set('Authorization', 'USER')
      .expect(400)
    });

    it('should update user role', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .send({role: EMemberRole.Monitor})
      .set('Authorization', 'USER')
      .expect(200)

      const updatedMember = await teamsDbConnection.collection('teammembers').findOne({'_id': manager.insertedId})
      expect(updatedMember.role).toEqual(EMemberRole.Monitor)
    });
  });

  describe('DELETE /teams/:teamId/users/:memberId', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .delete(`/teams/${1}/users/${2}`)
      .expect(401)
    });

    it('should return a 403 if not a team member', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      return await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${2}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should return a 403 if a team monitor', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor})
      const member2 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${member2.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if a team manager', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Manager})
      const member2 = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${member2.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should succeed if a team admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      return await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should delete the team member record', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor})
      await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)

      const member = await teamsDbConnection.collection('teammembers').findOne({'_id': manager.insertedId});
      expect(member).toBeNull();
    });

    it('should fail if deleting an admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const admin = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      const manager = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.MANAGER.id, email: ROLES.MANAGER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator})
      await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${manager.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(400)
    });

    it('should succeed if a monitor deletes themselves', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .delete(`/teams/${team1.insertedId.toString()}/users/${member.insertedId.toString()}`)
      .set('Authorization', 'USER')
      .expect(200)
    });

  });

  describe('PATCH /teams/:teamId/users/:userId/accept', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/teams/${1}/users/${2}/accept`)
      .expect(401)
    });

    it('should return a 403 if not the user in the userId', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.ADMIN.id}/accept`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if the user in the userId', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/accept`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should update the member status to confirmed', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor});
      await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/accept`)
      .set('Authorization', 'USER')
      .expect(200)

      const updatedMember = await teamsDbConnection.collection('teammembers').findOne({'_id': member.insertedId});
      expect(updatedMember).toHaveProperty('status', EMemberStatus.Confirmed);
      expect(updatedMember).toHaveProperty('userId', ROLES.USER.id)
    });
  });

  describe('PATCH /teams/:teamId/users/:userId/decline', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/teams/${1}/users/${2}/decline`)
      .expect(401)
    });

    it('should return a 403 if not the user in the userId', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.ADMIN.id}/decline`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if the user in the userId', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/decline`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should update the member status to declined', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Invited, role: EMemberRole.Monitor});
      await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/decline`)
      .set('Authorization', 'USER')
      .expect(200)

      const updatedMember = await teamsDbConnection.collection('teammembers').findOne({'_id': member.insertedId});
      expect(updatedMember).toHaveProperty('status', EMemberStatus.Declined);
      expect(updatedMember).toHaveProperty('userId', ROLES.USER.id)
    });
  });

  describe('PATCH /teams/:teamId/users/:userId/leave', () => {

    afterEach(async () => {
      await teamsDbConnection.collection('teams').deleteMany({});
      await teamsDbConnection.collection('teammembers').deleteMany({});
    });

    it('should return a 401 without authorisation', async () => {
      return await request(app.getHttpServer())
      .patch(`/teams/${1}/users/${2}/leave`)
      .expect(401)
    });

    it('should return a 403 if not the user in the userId', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.ADMIN.id}/leave`)
      .set('Authorization', 'USER')
      .expect(403)
    });

    it('should succeed if the user in the userId', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      return await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/leave`)
      .set('Authorization', 'USER')
      .expect(200)
    });

    it('should update the member role to left', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Monitor});
      await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/leave`)
      .set('Authorization', 'USER')
      .expect(200)

      const updatedMember = await teamsDbConnection.collection('teammembers').findOne({'_id': member.insertedId});
      expect(updatedMember).toHaveProperty('role', EMemberRole.Left);
      expect(updatedMember).toHaveProperty('userId', ROLES.USER.id)
    });

    it('should fail if the member is team admin', async () => {
      const team1 = await teamsDbConnection.collection('teams').insertOne({name: 'Test'});
      const member = await teamsDbConnection.collection('teammembers').insertOne({teamId: team1.insertedId.toString(), userId: ROLES.USER.id, email: ROLES.USER.email, status: EMemberStatus.Confirmed, role: EMemberRole.Administrator});
      await request(app.getHttpServer())
      .patch(`/teams/${team1.insertedId.toString()}/users/${ROLES.USER.id}/leave`)
      .set('Authorization', 'USER')
      .expect(400)

    });
  });

  afterAll(async () => {
    await teamsDbConnection.collection('teams').deleteMany({});
    await teamsDbConnection.collection('teammembers').deleteMany({});

    await app.close();
  })
});