"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const whitelist = [
    'name',
    'priority',
    'monitors',
    'notes',
    'status',
    'areaId',
    'templateId',
    'teamIds',
    'createdBy',
    'createdAt',
    'location',
    'alert'
];
const serializeResource = data => {
    const attributes = {};
    for (const [key, value] of Object.entries(JSON.parse(JSON.stringify(data)))) {
        if (whitelist.includes(key))
            attributes[key] = value;
    }
    return {
        type: "assignments",
        id: data._id,
        attributes
    };
};
const serializeAssignments = data => {
    if (Array.isArray(data))
        return data.map(arrayItem => serializeResource(arrayItem));
    else
        return serializeResource(data);
};
exports.default = serializeAssignments;
//# sourceMappingURL=assignments.serializer.js.map