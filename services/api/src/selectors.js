
import type { State } from './reducer';

const R = require('ramda');
const mapIndexed = R.addIndex(R.map);

const getAllSiteGroups =
      R.compose(
        R.map(([id, siteGroup]) => {
          return {
            ...siteGroup,
            id,
            siteGroupName: id,
          }
        }),
        (sitegroups) => Object.entries(sitegroups),
        R.propOr({}, 'siteGroups')
      );

module.exports = {
  getAllSiteGroups,
};

