import mongoose from 'mongoose';
import ROLES from '../../common/testConstants';

export default {
  userTemplate: {
    name: {
      en: 'Default',
    },
    user: new mongoose.Types.ObjectId(ROLES.USER.id),
    questions: [
      {
        type: 'text',
        name: 'question-1',
        conditions: [],
        childQuestions: [],
        order: 0,
        required: false,
        label: {
          en: 'test',
        },
      },
    ],
    languages: ['en'],
    status: 'published',
    defaultLanguage: 'en',
    editGroupId: new mongoose.Types.ObjectId(),
    isLatest: true,
    public: false,
  },
  managerTemplate: {
    name: {
      en: 'Default',
    },
    user: new mongoose.Types.ObjectId(ROLES.MANAGER.id),
    questions: [
      {
        type: 'text',
        name: 'question-1',
        conditions: [],
        childQuestions: [],
        order: 0,
        required: false,
        label: {
          en: 'test',
        },
      },
    ],
    languages: ['en'],
    status: 'published',
    defaultLanguage: 'en',
    editGroupId: new mongoose.Types.ObjectId(),
    isLatest: true,
    public: false,
  },
  defaultTemplate: {
    name: {
      en: 'Default',
    },
    user: new mongoose.Types.ObjectId(ROLES.ADMIN.id),
    questions: [
      {
        type: 'text',
        name: 'question-1',
        conditions: [],
        childQuestions: [],
        order: 0,
        required: false,
        label: {
          en: 'test',
        },
      },
    ],
    languages: ['en'],
    status: 'published',
    defaultLanguage: 'en',
    public: true,
    editGroupId: new mongoose.Types.ObjectId(),
    isLatest: true,
  },
};
