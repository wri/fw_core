import { Injectable } from '@nestjs/common';
import moment from 'moment';

const globalAlerts = [
  {
    slug: 'viirs',
    name: 'VIIRS',
    active: false,
    startDate: '1',
    endDate: '8',
  },
];

@Injectable()
export class DatasetService {
  getDatasetsWithActive(datasets) {
    if (!(datasets.length > 0) || datasets.find((d) => d.active))
      return datasets;

    datasets[0].active = true;
    return datasets;
  }

  getDatasetsWithCoverage(list, layers) {
    const datasets = !list || list.length === 0 ? globalAlerts : list;
    const glad = {
      slug: 'umd_as_it_happens',
      name: 'GLAD',
      active: false,
      startDate: 6,
      endDate: moment().format('YYYYMMDD'),
    };
    const areaHasGlad = layers.includes(glad.slug);
    const datasetsHasGlad = datasets.find(
      (dataset) => dataset.slug === glad.slug,
    );
    if (areaHasGlad && !datasetsHasGlad) {
      return this.getDatasetsWithActive([glad, ...datasets]);
    }
    return this.getDatasetsWithActive(datasets);
  }
}
