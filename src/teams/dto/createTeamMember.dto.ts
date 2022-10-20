import { EMemberRole, EMemberStatus } from '../models/teamMember.schema';

export type TMemberRole = Exclude<EMemberRole, EMemberRole.Left>;

export class CreateTeamMemberDto {
  teamId?: string;
  userId?: string;
  email: string;
  role: TMemberRole;
  status?: EMemberStatus;
}
