const { Sql } = require('./environment');

describe('Sql', () => {
  describe('updateEnvironment', () => {
    it('should create a proper query', () => {
      const input = {
        name: 'e1',
        patch: {
          project: 1,
        },
      };
      const ret = Sql.updateEnvironment({}, input);
      expect(ret).toMatchSnapshot();
    });
  });
  describe('selectEnvironment', () => {
    it('should create a proper query', () => {
      const ret = Sql.selectEnvironmentByName("e1");
      expect(ret).toMatchSnapshot();
    });
  });
});
