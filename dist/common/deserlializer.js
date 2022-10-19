"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deserialize = data => {
    let returnObject = {};
    if (data.id)
        returnObject.id = data.id;
    for (const [key, value] of Object.entries(data.attributes))
        returnObject[key] = value;
    return returnObject;
};
exports.default = deserialize;
//# sourceMappingURL=deserlializer.js.map