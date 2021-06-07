/* eslint-disable global-require */

import general from './general/renderer';
import scene from './scene/renderer';
import source from './source/renderer';

const isRenderer = process && process.type === 'renderer';

if (!isRenderer) {
  require('./general/main');
  require('./scene/main');
  require('./source/main');
}

export default {
  general,
  scene,
  source,
};
