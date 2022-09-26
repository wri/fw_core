import { Module } from '@nestjs/common';
import { AreasService } from '../services/areas.service';
import { AreasController } from '../controllers/areas.controller';
import { UserService } from '../../common/user.service';
import { GeostoreService } from '../services/geostore.service';
import { DatasetService } from '../services/dataset.service';
import { CoverageService } from '../services/coverage.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamAreaRelationService } from '../services/teamAreaRelation.service';
import { Team, TeamSchema } from '../../teams/models/team.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamMembersService } from '../../teams/services/teamMembers.service';
import { TeamMember, TeamMemberSchema } from '../../teams/models/teamMember.schema';
import { TeamAreaRelation, TeamAreaRelationSchema } from '../models/teamAreaRelation.schema';
import { TemplateAreaRelationService } from '../services/templateAreaRelation.service';
import { TemplateAreaRelation, TemplateAreaRelationSchema } from '../models/templateAreaRelation.schema';
import { ResponseService } from '../services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
    MongooseModule.forFeature([{ name: TeamMember.name, schema: TeamMemberSchema }]),
    MongooseModule.forFeature([{ name: TeamAreaRelation.name, schema: TeamAreaRelationSchema }]),
    MongooseModule.forFeature([{ name: TemplateAreaRelation.name, schema: TemplateAreaRelationSchema }])
  ],
  controllers: [AreasController],
  providers: [
    AreasService, 
    UserService, 
    GeostoreService, 
    DatasetService, 
    CoverageService, 
    TeamsService,
    TeamMembersService,
    TeamAreaRelationService,
    TemplateAreaRelationService,
    UserService,
    ResponseService
  ]
})
export class AreasModule {}
