// @flow

const { getServerInfoFromFilename } = require('../../storage/site');

describe('getServerInfoFromFilename', () => {
  test('should return server information', () => {
    const serverInfo = getServerInfoFromFilename('compact/deploytest1.yaml');
    expect(
      serverInfo,
    ).toEqual({ fileName: 'compact/deploytest1.yaml', serverInfrastructure: 'compact', serverIdentifier: 'deploytest1' });
  });

  test('should not break on deeper directory hierarchies', () => {
    const serverInfo = getServerInfoFromFilename('deep/deeper/compact/deploytest1.yaml');
    expect(
      serverInfo,
    ).toEqual({ fileName: 'deep/deeper/compact/deploytest1.yaml', serverInfrastructure: 'compact', serverIdentifier: 'deploytest1' });
  });
  test('should return null with an invalid path', () => {
    const serverInfo = getServerInfoFromFilename('invalid/path');
    expect(serverInfo).toEqual(null);
  });
});
