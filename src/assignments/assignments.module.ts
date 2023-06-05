import { forwardRef, Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './models/assignment.schema';
import { UserService } from '../common/user.service';
import { AreasModule } from '../areas/modules/areas.module';
import { S3Service } from '../answers/services/s3Service';
import { TemplatesModule } from '../templates/templates.module';
import { TeamsModule } from '../teams/modules/teams.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Assignment.name, schema: AssignmentSchema }],
      'formsDb',
    ),
    AreasModule,
    forwardRef(() => TemplatesModule),
    TeamsModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, UserService, S3Service],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
