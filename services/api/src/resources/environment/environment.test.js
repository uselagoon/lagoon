const { Sql } = require('./sql');

describe('Sql', () => {
  describe('updateEnvironment', () => {
    it('should create a proper query', () => {
      const input = {
        id: 1,
        patch: {
          project: 1,
        },
      };
      const ret = Sql.updateEnvironment(input);
      expect(ret).toMatchSnapshot();
    });
  });
  describe('selectEnvironment', () => {
    it('should create a proper query', () => {
      const ret = Sql.selectEnvironmentById(1);
      expect(ret).toMatchSnapshot();
    });
  });
});
