"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTemplateDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_template_dto_1 = require("./create-template.dto");
class UpdateTemplateDto extends (0, mapped_types_1.PartialType)(create_template_dto_1.CreateTemplateDto) {
}
exports.UpdateTemplateDto = UpdateTemplateDto;
//# sourceMappingURL=update-template.dto.js.map