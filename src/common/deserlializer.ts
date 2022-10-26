const deserialize = (data) => {
  type ReturnObject = { [key: string]: any };
  const returnObject: ReturnObject = {};
  if (data.id) returnObject.id = data.id;
  for (const [key, value] of Object.entries(data.attributes))
    returnObject[key] = value;
  return returnObject;
};

export default deserialize;
