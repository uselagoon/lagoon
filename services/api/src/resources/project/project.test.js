// @flow

const Sql = require('./sql');

describe('Resolvers', () => {
  describe('updateProject', () => {
    it('should return proper update statement', () => {
      const input = {
        id: 1,
        patch: {
          name: 'test',
        },
      };
      const ret = Sql.updateProject(input);

      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectProject', () => {
    it('should create query', () => {
      const ret = Sql.selectProject(1);
      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectAllUsersForProjectId', () => {
    it('should return proper select statement', () => {
      const ret = Sql.selectAllUsersForProjectId(1);

      expect(ret).toMatchSnapshot();
    });
  });
});
