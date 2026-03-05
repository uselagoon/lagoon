// Manual mock for node-fetch 3.x (ESM-only — incompatible with Jest CJS mode).
// Returns a minimal fetch implementation sufficient for unit tests.

const mockResponse = (body = '{}', status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'OK',
  headers: { get: jest.fn(() => null) },
  json: jest.fn().mockResolvedValue(JSON.parse(body)),
  text: jest.fn().mockResolvedValue(body),
  arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(body)),
});

const fetch = jest.fn().mockResolvedValue(mockResponse());

module.exports = fetch;
module.exports.default = fetch;
