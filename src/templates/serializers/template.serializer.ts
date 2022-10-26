const whitelist = [
  'name',
  'languages',
  'defaultLanguage',
  'user',
  'answersCount',
  'questions',
  'createdAt',
  'public',
  'status',
];

const serializeResource = (data) => {
  const attributes = {};
  for (const [key, value] of Object.entries(data.toJSON()))
    if (whitelist.includes(key)) attributes[key] = value;

  return {
    type: 'reports',
    id: data._id,
    attributes,
  };
};

const serializeTemplate = (data) => {
  if (Array.isArray(data))
    return data.map((arrayItem) => serializeResource(arrayItem));
  else return serializeResource(data);
};

export default serializeTemplate;
