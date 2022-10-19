"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssignmentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_assignment_dto_1 = require("./create-assignment.dto");
class UpdateAssignmentDto extends (0, mapped_types_1.PartialType)(create_assignment_dto_1.CreateAssignmentDto) {
}
exports.UpdateAssignmentDto = UpdateAssignmentDto;
//# sourceMappingURL=update-assignment.dto.js.map