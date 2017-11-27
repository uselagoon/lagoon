// @flow

const notFoundRoute = (req, res) =>
  res.status(404).json({
    status: 'error',
    message: `No endpoint exists at ${req.originalUrl} (method: ${req.method})`,
  });

module.exports = [notFoundRoute];
