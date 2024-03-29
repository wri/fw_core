export class CreateAnswerDto {
  reportName: string;
  areaOfInterest?: string;
  areaOfInterestName?: string;
  language: string;
  userPosition?: string;
  clickedPosition?: string;
  startDate?: string;
  endDate?: string;
  layer?: string;
  date?: string;
  teamId?: string;
  assignmentId?: string;
  [questionName: string]: string | number | undefined;
}
