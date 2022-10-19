"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const error_serializer_1 = __importDefault(require("./common/error.serializer"));
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield core_1.NestFactory.create(app_module_1.AppModule);
        app.useGlobalPipes(new common_1.ValidationPipe());
        app.setGlobalPrefix('v3/gfw');
        app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield next();
            }
            catch (inErr) {
                let error = inErr;
                try {
                    error = JSON.parse(inErr);
                }
                catch (e) {
                    common_1.Logger.error("Could not parse error message - is it JSON?: ", inErr);
                    error = inErr;
                }
                res.status = error.status || res.status || 500;
                if (res.status >= 500) {
                    common_1.Logger.error(error);
                }
                else {
                    common_1.Logger.log(error);
                }
                res.body = error_serializer_1.default.serializeError(res.status, error.message);
                if (process.env.NODE_ENV === "production" && res.status === 500) {
                    res.body = "Unexpected error";
                }
                res.type = "application/vnd.api+json";
            }
        }));
        yield app.listen(process.env.PORT);
        console.log(`App running on: ${yield app.getUrl()}`);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map