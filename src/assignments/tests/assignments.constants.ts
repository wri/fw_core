import areaConstants from '../../areas/test/area.constants';
import ROLES from '../../common/testConstants';

export default {
  defaultAssignment: {
    location: { lat: 1, lon: 1, alertType: null },
    geostore: {
      type: 'FeatureCollection',
      features: [
        {
          id: 'c6ecdcc9634513b62baa33d4ccc49150',
          type: 'Feature',
          properties: {},
          geometry: {
            coordinates: [
              [
                [-95.028200874698, 37.38105781921557],
                [-95.02817304677922, 37.38104995995566],
                [-95.02815259493569, 37.38107327131698],
                [-95.028200874698, 37.381083528313184],
                [-95.028200874698, 37.38105781921557],
              ],
            ],
            type: 'Polygon',
          },
        },
      ],
    },
    priority: 1,
    monitors: [ROLES.USER.id],
    notes: 'some notes',
    status: 'open',
    alert: 'some alert',
    areaId: areaConstants.testArea.id,
    templateIds: ['someTemplateId'],
  },
  geostore: {
    geojson: {
      crs: {},
      type: 'FeatureCollection',
      features: [
        {
          geometry: {
            coordinates: [
              [
                [-2.013240043, 50.73880781],
                [-2.013847362, 50.73468156],
                [-2.01433955, 50.73255114],
                [-2.014712664, 50.731382138],
                [-2.011802376, 50.730945231],
                [-2.010944214, 50.733295036],
                [-2.007940648, 50.735278699],
                [-2.006969881, 50.737753402],
                [-2.013240043, 50.73880781],
              ],
            ],
            type: 'Polygon',
          },
          type: 'Feature',
        },
      ],
    },
    hash: 'c826fac0aa7686055695a85abd2625e0',
    provider: {},
    areaHa: 26.762628735804704,
    bbox: [-2.014712664, 50.730945231, -2.006969881, 50.73880781],
    lock: true,
    info: {
      use: {},
    },
    id: 'c826fac0aa7686055695a85abd2625e0',
  },
};
