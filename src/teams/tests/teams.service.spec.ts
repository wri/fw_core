import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../common/user.service';
import { Team, TeamSchema } from '../models/team.schema';
import { TeamMember, TeamMemberSchema } from '../models/teamMember.schema';
import { TeamMembersService } from '../services/teamMembers.service';
import { TeamsService } from '../services/teams.service';

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService, 
        TeamMembersService,
        UserService, 
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
