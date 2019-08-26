const {
  Transport: LokkaTransportHttp,
} = require('@lagoon/lokka-transport-http');
const fetchUrl = require('node-fetch');

class NetworkError extends Error {}
class ApiError extends Error {}

// Retries the fetch if operational/network errors occur
const retryFetch = (endpoint, options, retriesLeft = 5, interval = 1000) =>
  new Promise((resolve, reject) =>
    fetchUrl(endpoint, options)
      .then(response => {
        if (response.status !== 200 && response.status !== 400) {
          throw new NetworkError(`Invalid status code: ${response.status}`);
        }

        return response.json();
      })
      .then(({ data, errors }) => {
        if (errors) {
          const error = new ApiError(`GraphQL Error: ${errors[0].message}`);
          error.rawError = errors;
          error.rawData = data;
          throw error;
        }

        resolve(data);
      })
      .catch(error => {
        // Don't retry if limit is reached or the error was not network/operational
        if (retriesLeft === 1 || error instanceof ApiError) {
          reject(error);
          return;
        }

        setTimeout(() => {
          retryFetch(endpoint, options, retriesLeft - 1).then(resolve, reject);
        }, interval);
      }),
  );

class Transport extends LokkaTransportHttp {
  constructor(endpoint, options = {}) {
    super(endpoint, options);
  }

  send(query, variables, operationName) {
    const payload = { query, variables, operationName };
    const options = this._buildOptions(payload);

    return retryFetch(this.endpoint, options);
  }
}

module.exports = {
  Transport,
};
