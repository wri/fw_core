"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAreaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_area_dto_1 = require("./create-area.dto");
class UpdateAreaDto extends (0, mapped_types_1.PartialType)(create_area_dto_1.CreateAreaDto) {
}
exports.UpdateAreaDto = UpdateAreaDto;
//# sourceMappingURL=update-area.dto.js.map