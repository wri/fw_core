"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testConstants_1 = __importDefault(require("../../common/testConstants"));
exports.default = {
    userTemplate: {
        name: {
            en: 'Default'
        },
        user: testConstants_1.default.USER.id,
        questions: [{
                "type": "text",
                "name": "question-1",
                "conditions": [],
                "childQuestions": [],
                "order": 0,
                "required": false,
                "label": {
                    "en": "test"
                }
            }],
        languages: ["en"],
        status: 'published',
        defaultLanguage: 'en',
        public: false
    },
    managerTemplate: {
        name: {
            en: 'Default'
        },
        user: testConstants_1.default.MANAGER.id,
        questions: [{
                "type": "text",
                "name": "question-1",
                "conditions": [],
                "childQuestions": [],
                "order": 0,
                "required": false,
                "label": {
                    "en": "test"
                }
            }],
        languages: ["en"],
        status: 'published',
        defaultLanguage: 'en',
        public: false
    },
    defaultTemplate: {
        name: {
            en: 'Default'
        },
        user: testConstants_1.default.ADMIN.id,
        questions: [{
                "type": "text",
                "name": "question-1",
                "conditions": [],
                "childQuestions": [],
                "order": 0,
                "required": false,
                "label": {
                    "en": "test"
                }
            }],
        languages: ["en"],
        status: 'published',
        defaultLanguage: 'en',
        public: true
    }
};
//# sourceMappingURL=templates.constants.js.map