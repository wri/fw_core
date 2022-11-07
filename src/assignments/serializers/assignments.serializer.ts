const whitelist = [
  'name',
  'priority',
  'geostore',
  'monitors',
  'notes',
  'image',
  'status',
  'areaId',
  'templateIds',
  'createdBy',
  'createdAt',
  'location',
  'alert',
  'areaName',
  'monitorNames',
  'templates',
];

const serializeResource = (data) => {
  const attributes = {};
  for (const [key, value] of Object.entries(JSON.parse(JSON.stringify(data)))) {
    if (whitelist.includes(key)) attributes[key] = value;
  }
  return {
    type: 'assignments',
    id: data._id,
    attributes,
  };
};

const serializeAssignments = (data) => {
  if (Array.isArray(data))
    return data.map((arrayItem) => serializeResource(arrayItem));
  else return serializeResource(data);
};

export default serializeAssignments;
