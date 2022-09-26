import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import { Team } from '../../teams/models/team.schema';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelation } from '../models/teamAreaRelation.schema';
import { TemplateAreaRelation } from '../models/templateAreaRelation.schema';
import { AreasService } from '../services/areas.service';
import { CoverageService } from '../services/coverage.service';
import { DatasetService } from '../services/dataset.service';
import { GeostoreService } from '../services/geostore.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TeamMember } from '../../teams/models/teamMember.schema';
import { UserService } from '../../common/user.service';

describe('AreasService', () => {
  let service: AreasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasService, 
        GeostoreService, 
        DatasetService, 
        CoverageService, 
        TeamAreaRelationService, 
        TemplateAreaRelationService,
        TeamsService,
        TeamMembersService,
        UserService,
        {provide: getModelToken(TeamAreaRelation.name), useValue: jest.fn()},
        {provide: getModelToken(TemplateAreaRelation.name), useValue: jest.fn()},
        {provide: getModelToken(Team.name), useValue: jest.fn()},
        {provide: getModelToken(TeamMember.name), useValue: jest.fn()}
      ],
    }).compile();

    service = module.get<AreasService>(AreasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
