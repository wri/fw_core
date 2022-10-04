const whitelist = [
  "report",
  "reportName",
  "username",
  "fullName",
  "organization",
  "teamId",
  "areaOfInterest",
  "areaOfInterestName",
  "language",
  "userPosition",
  "clickedPosition",
  "startDate",
  "endDate",
  "layer",
  "user",
  "createdAt",
  "responses",
  "templateName"
];

const serializeResource = data => {

  const attributes = {};
  for(const [key, value] of Object.entries(JSON.parse(JSON.stringify(data)))) {
    if(whitelist.includes(key)) attributes[key] = value;
  }
  return {
    type: "answers",
    id: data._id,
    attributes
  };
}

const serializeAnswers = data => {

  if(Array.isArray(data)) return data.map(arrayItem => serializeResource(arrayItem));
  else return serializeResource(data);

}

export default serializeAnswers
