import areaConstants from '../../areas/test/area.constants';
import ROLES from '../../common/testConstants';

export default {
  defaultAssignment: {
    location: {},
    priority: 1,
    monitors: [ROLES.USER.id],
    notes: 'some notes',
    status: 'open',
    alert: 'some alert',
    areaId: areaConstants.testArea.id,
    templateId: 'someTemplateId',
    teamIds: [],
  },
};
