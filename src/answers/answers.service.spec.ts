import { Test, TestingModule } from '@nestjs/testing';
import { AnswersService } from './answers.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { UserService } from '../common/user.service';
import { Answer } from './models/answer.model';
import { getModelToken } from '@nestjs/mongoose';
import { Team } from '../teams/models/team.schema';
import { TeamMember } from '../teams/models/teamMember.schema';


describe('AnswersService', () => {
  let service: AnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService, 
        TeamMembersService, 
        UserService,
        {provide: getModelToken(Answer.name), useValue: jest.fn()},
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
      ],
    }).compile();

    service = module.get<AnswersService>(AnswersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
