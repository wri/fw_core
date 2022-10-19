import { EMemberRole, EMemberStatus } from "../models/teamMember.schema";
export declare type TMemberRole = Exclude<EMemberRole, EMemberRole.Left>;
export declare class CreateTeamMemberDto {
    teamId?: string;
    userId?: string;
    email: string;
    role: TMemberRole;
    status?: EMemberStatus;
}
