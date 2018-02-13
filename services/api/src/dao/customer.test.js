const { Sql } = require('./customer');

describe('Sql', () => {
  describe('updateCustomer', () => {
    it('should create a proper query', () => {
      const cred = {
        permissions: {
          customers: [1, 2, 3]
        }
      };
      const input = {
        id: 1,
        patch: {
          name: "test"
        }
      }

      const ret = Sql.updateCustomer(cred, input);
      expect(ret).toMatchSnapshot();
    });
  });
  describe('selectCustomer', () => {
    it('should create a proper query', () => {
      const ret = Sql.selectCustomer(1);

      expect(ret).toMatchSnapshot();
    });
  });

});
