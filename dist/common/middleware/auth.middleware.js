"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user.service");
let AuthMiddleware = class AuthMiddleware {
    constructor(userService) {
        this.userService = userService;
    }
    use(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.headers.authorization)
                throw new common_1.HttpException('Unauthorised', common_1.HttpStatus.UNAUTHORIZED);
            const userData = yield this.userService.authorise(req.headers.authorization);
            if (!userData && !userData.id)
                throw new common_1.HttpException('Unauthorised', common_1.HttpStatus.UNAUTHORIZED);
            userData.token = req.headers.authorization;
            if (["GET", "DELETE"].includes(req.method.toUpperCase())) {
                req.query = Object.assign(Object.assign({}, req.query), { loggedUser: JSON.stringify(userData) });
                req.user = userData;
            }
            else if (["POST", "PATCH", "PUT"].includes(req.method.toUpperCase())) {
                req.body.loggedUser = userData;
                req.user = userData;
            }
            next();
        });
    }
};
AuthMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AuthMiddleware);
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map