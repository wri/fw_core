const whitelist = [
  'areaId',
  'destination',
  'difficulty',
  'startDate',
  'endDate',
  'geostoreId',
  'routeId',
  'locations',
  'name',
  'createdBy',
  'active',
  'teamId',
  'username',
];

const serializeResource = (data) => {
  const attributes = {};
  for (const [key, value] of Object.entries(JSON.parse(JSON.stringify(data)))) {
    if (whitelist.includes(key)) attributes[key] = value;
  }
  return {
    type: 'routes',
    id: data._id,
    attributes,
  };
};

const serializeRoutes = (data) => {
  if (Array.isArray(data))
    return data.map((arrayItem) => serializeResource(arrayItem));
  else return serializeResource(data);
};

export default serializeRoutes;
