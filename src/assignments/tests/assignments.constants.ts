import ROLES from "../../common/testConstants"

export default {
  defaultAssignment: {
    name: "not visible",
    location: {},
    priority: 1,
    monitors: [ROLES.USER.id],
    notes: "some notes",
    status: "incomplete",
    alert: "some alert",
    areaId: "someAreaId",
    templateId: "someTemplateId",
    teamIds: [],
  }
}