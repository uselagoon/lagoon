// Manual mock for redis v3 — prevents a live TCP connection from being opened
// at import time (which keeps Jest's open-handle detector busy).

const EventEmitter = require('events');

const createMockClient = () => {
  const client = new EventEmitter();
  client.get = jest.fn((key, cb) => cb && cb(null, null));
  client.set = jest.fn((key, value, cb) => cb && cb(null, 'OK'));
  client.del = jest.fn((key, cb) => cb && cb(null, 1));
  client.expire = jest.fn((key, ttl, cb) => cb && cb(null, 1));
  client.quit = jest.fn((cb) => { if (cb) cb(null, 'OK'); });
  client.end = jest.fn();
  client.connected = false;
  client.ready = false;
  return client;
};

module.exports = {
  createClient: jest.fn(createMockClient),
};
