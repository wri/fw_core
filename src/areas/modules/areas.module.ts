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
import { DatabaseModule } from '../../common/database/database.module';
import { DatabaseService } from '../../common/database/database.service';
import { TemplatesService } from '../../templates/templates.service';
import { Template, TemplateSchema } from '../../templates/models/template.schema';
import { TeamAreaRelationController } from '../controllers/teamAreaRelation.controller';
import { TemplateAreaRelationController } from '../controllers/templateAreaRelation.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "GFWTeam", schema: TeamSchema }], 'teamsDb'),
    MongooseModule.forFeature([{ name: TeamMember.name, schema: TeamMemberSchema }], 'teamsDb'),
    MongooseModule.forFeature([{ name: TeamAreaRelation.name, schema: TeamAreaRelationSchema }], 'apiDb'),
    MongooseModule.forFeature([{ name: TemplateAreaRelation.name, schema: TemplateAreaRelationSchema }], 'apiDb'),
    MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }], 'formsDb'),
    ConfigModule
  ],
  controllers: [AreasController, TeamAreaRelationController, TemplateAreaRelationController],
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
    ResponseService,
    TemplatesService
  ]
})
export class AreasModule {}
