import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { UserService } from '../../common/user.service';
import { TeamsController } from '../controllers/teams.controller';
import { Team, TeamSchema } from '../models/team.schema';
import { TeamMember, TeamMemberSchema } from '../models/teamMember.schema';
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamsService } from '../services/teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TeamsController],
      providers: [
        TeamsService, 
        UserService, 
        TeamMembersService,
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
