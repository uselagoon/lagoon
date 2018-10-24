const Sql = require('./sql');

describe('Sql', () => {
  describe('updateCustomer', () => {
    it('if not admin, should create statement with IN clause', () => {
      const cred = {
        permissions: {
          customers: [1, 2, 3],
        },
      };
      const input = {
        id: 1,
        patch: {
          name: 'test',
        },
      };

      const ret = Sql.updateCustomer(cred, input);
      expect(ret).toMatchSnapshot();
    });

    it('if admin, should not create IN clause', () => {
      const cred = {
        role: 'admin',
        permissions: {},
      };
      const input = {
        id: 1,
        patch: {
          name: 'test',
        },
      };

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
  describe('selectCustomerByName', () => {
    it('if not admin, should create statement with IN clause', () => {
      const cred = {
        role: 'user',
        permissions: {
          customers: [1, 2],
        },
      };

      const ret = Sql.selectCustomerByName(cred, 'c1');
      expect(ret).toMatchSnapshot();
    });

    it('if admin, should not create IN clause', () => {
      const cred = {
        role: 'admin',
        permissions: {},
      };

      const ret = Sql.selectCustomerByName(cred, 'c1');
      expect(ret).toMatchSnapshot();
    });
  });
});
