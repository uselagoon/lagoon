// @flow

const statusRoute = (req /* : Object */, res /* : Object */) => {
  // @todo Add logic to fetch the status.
  const status = {};

  res.json({ status: 'success', data: status });
};

module.exports = [statusRoute];
