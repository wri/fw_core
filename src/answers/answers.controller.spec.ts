import { Test, TestingModule } from '@nestjs/testing';
import { AnswersController } from './answers.controller';
import { AnswersService } from './answers.service';
import { TeamsService } from '../teams/services/teams.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { UserService } from '../common/user.service';
import { Answer } from './models/answer.model';
import { getModelToken } from '@nestjs/mongoose';
import { Team } from '../teams/models/team.schema';
import { TeamMember } from '../teams/models/teamMember.schema';


describe('AnswersController', () => {
  let controller: AnswersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswersController],
      providers: [
        AnswersService, 
        TeamsService, 
        TeamMembersService, 
        UserService,
        {provide: getModelToken(Answer.name), useValue: jest.fn()},
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
      ],
    }).compile();

    controller = module.get<AnswersController>(AnswersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
