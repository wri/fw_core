const whitelist = ["teamId", "userId", "email", "role", "status", "name"]

const serializeResource = data => {

  const attributes = {};
  for(const [key, value] of Object.entries(JSON.parse(JSON.stringify(data)))) {
    if(whitelist.includes(key)) attributes[key] = value;
  }

  return {
    type: "teamMember",
    id: data._id,
    attributes
  }
}

const serializeTeamMember = data => {

  if(Array.isArray(data)) return data.map(arrayItem => serializeResource(arrayItem));
  else return serializeResource(data)

}

export default serializeTeamMember

