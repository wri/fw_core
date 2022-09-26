import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { AnswersService } from '../answers/answers.service';
import { UserService } from '../common/user.service';
import { TeamsService } from '../teams/services/teams.service';
import { getModelToken } from '@nestjs/mongoose';
import { Template } from './models/template.schema';
import { Answer } from '../answers/models/answer.model';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { Team } from '../teams/models/team.schema';
import { TeamMember } from '../teams/models/teamMember.schema';

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService, 
        AnswersService, 
        TeamsService,
        TeamMembersService, 
        UserService,
        {provide: getModelToken(Template.name), useValue: jest.fn()},
        {provide: getModelToken(Answer.name), useValue: jest.fn()},
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}

      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
