"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testConstants_1 = __importDefault(require("../../common/testConstants"));
exports.default = {
    defaultAssignment: {
        name: "not visible",
        location: {},
        priority: 1,
        monitors: [testConstants_1.default.USER.id],
        notes: "some notes",
        status: "incomplete",
        alert: "some alert",
        areaId: "someAreaId",
        templateId: "someTemplateId",
        teamIds: [],
    }
};
//# sourceMappingURL=assignments.constants.js.map