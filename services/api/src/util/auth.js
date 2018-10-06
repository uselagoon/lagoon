const R = require('ramda');

const notEmptyOrNaN /* : Function */ = R.allPass([
  R.compose(
    R.not,
    R.isEmpty,
  ),
  R.compose(
    R.not,
    R.equals(NaN),
  ),
]);

// Input: Comma-separated string with ids (defaults to '' if null)
// Output: Array of ids as strings
const splitCommaSeparatedPermissions /* :  (?string) => Array<string> */ = R.compose(
  // MariaDB returns number ids as strings. In order to avoid
  // having to compare numbers with strings later on, this
  // function casts them back to string.
  R.map(R.toString),
  R.filter(notEmptyOrNaN),
  R.map(strId => parseInt(strId)),
  R.split(','),
  R.defaultTo(''),
);

const getPermissionsForUser = async (dao, userId) => {
  const rawPermissions = await dao.getPermissions({ userId });

  if (rawPermissions == null) {
    return {};
  }

  // Split comma-separated permissions values to arrays
  const permissions = R.compose(
    R.over(R.lensProp('customers'), splitCommaSeparatedPermissions),
    R.over(R.lensProp('projects'), splitCommaSeparatedPermissions),
    R.defaultTo({}),
  )(rawPermissions);

  return permissions;
};

module.exports = {
  getPermissionsForUser,
  splitCommaSeparatedPermissions,
};
