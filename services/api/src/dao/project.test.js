const { Sql } = require('./project');

describe('Queries', () => {
  describe('updateProject', () => {
    it('should return proper update statement', () => {
      const cred = {
        role: 'user',
        permissions: {
          projects: [1, 2, 3],
        },
      };
      const input = {
        id: '1',
        patch: {
          name: 'test',
        },
      };
      const ret = Sql.updateProject(cred, input);

      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectProject', () => {
    it('should create query', () => {
      const ret = Sql.selectProject('1');
      expect(ret).toMatchSnapshot();
    });
  });
});
