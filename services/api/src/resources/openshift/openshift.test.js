const { Sql } = require('./sql');

describe('Sql', () => {
  describe('updateOpenshift', () => {
    it('should create a proper statement', () => {
      const input = {
        id: 1,
        patch: {
          name: 'test'
        }
      };

      const ret = Sql.updateOpenshift(input);
      expect(ret).toMatchSnapshot();
    });
  });
  describe('selectOpenshift', () => {
    it('should create a proper statement', () => {
      const ret = Sql.selectOpenshift(1);
      expect(ret).toMatchSnapshot();
    });
  });
});
