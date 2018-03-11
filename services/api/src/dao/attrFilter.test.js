const attrFilter = require('./attrFilter');

describe('openshift', () => {
  it('should filter token if normal user', () => {
    const entity = { token: 'openshift1', other: 'test' };

    const ret = attrFilter.openshift({ role: 'user' }, entity);
    expect(ret).not.toHaveProperty('token');
  });
});
