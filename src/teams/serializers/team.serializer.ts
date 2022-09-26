const whitelist = ["name", "userRole", "createdAt", "members", "areas"];

const serializeResource = data => {

  const attributes = {};
  for(const [key, value] of Object.entries(JSON.parse(JSON.stringify(data)))) {
    if(whitelist.includes(key)) attributes[key] = value;
  }

  return {
    type: "team",
    id: data._id || data.id,
    attributes
  };
}

const serializeTeam = data => {
  
  if(Array.isArray(data)) return data.map(arrayItem => serializeResource(arrayItem));
  else return serializeResource(data);

}

export default serializeTeam
