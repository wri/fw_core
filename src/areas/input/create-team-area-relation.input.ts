import { IsNotEmpty } from 'class-validator';

export class CreateTeamAreaRelationInput {
  @IsNotEmpty()
  areaId: string;

  @IsNotEmpty()
  teamId: string;
}
