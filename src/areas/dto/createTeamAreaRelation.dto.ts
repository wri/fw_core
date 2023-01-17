import { IsDefined, IsNotEmpty } from 'class-validator';

export class CreateTeamAreaRelationDto {
  @IsDefined()
  @IsNotEmpty()
  areaId: string;
  @IsDefined()
  @IsNotEmpty()
  teamId: string;
}
