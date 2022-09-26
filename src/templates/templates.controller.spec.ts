import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Answer } from '../answers/models/answer.model';
import { Team } from '../teams/models/team.schema';
import { AnswersService } from '../answers/answers.service';
import { UserService } from '../common/user.service';
import { TeamsService } from '../teams/services/teams.service';
import { Template } from './models/template.schema';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TeamMembersService } from '../teams/services/teamMembers.service';
import { TeamMember } from '../teams/models/teamMember.schema';

describe('TemplatesController', () => {
  let controller: TemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        TemplatesService, 
        AnswersService, 
        TeamsService, 
        UserService,
        TeamMembersService,
        {provide: getModelToken(Template.name), useValue: jest.fn()},
        {provide: getModelToken(Answer.name), useValue: jest.fn()},
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
