export default (request, response) => {
  debug('Fetching status.');

  // TODO Add logic to fetch the status.
  const status = {};

  response.json({
    status: 'success',
    data: status,
  });
};
