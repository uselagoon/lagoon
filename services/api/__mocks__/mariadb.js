// Manual mock for mariadb (ESM package — not compatible with Jest's CJS transform).
// Tests that transitively import src/clients/sqlClient will use this instead of
// the real driver. Unit tests should never hit a real database.

const mockPool = {
  query: jest.fn().mockResolvedValue([]),
  getConnection: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([]),
    release: jest.fn(),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  }),
  end: jest.fn().mockResolvedValue(undefined),
};

const createPool = jest.fn(() => mockPool);

module.exports = { createPool, default: { createPool } };
