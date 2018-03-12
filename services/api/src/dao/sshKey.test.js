const { Sql } = require('./sshKey');

describe('Sql', () => {
  describe('allowedToModify', () => {
    it('if not admin, should create statement with IN clauses', () => {
      const cred = {
        role: 'user',
        permissions: {
          customers: [],
          projects: ['2', '1'],
        },
      };
      const id = 1;
      const ret = Sql.allowedToModify(cred, id);

      expect(ret).toMatchSnapshot();
    });

    it('if admin, should create statement without IN clause', () => {
      const cred = {
        role: 'admin',
        permissions: {
          customers: [],
          projects: [],
        },
      };
      const id = 1;
      const ret = Sql.allowedToModify(cred, id);

      expect(ret).toMatchSnapshot();
    });
  });

  describe('updateSshKey', () => {
    it('should create a proper query', () => {
      const cred = {};
      const input = {
        id: 1,
        patch: {
          keyType: 'ssh-rsa',
        },
      };
      const ret = Sql.updateSshKey(cred, input);
      expect(ret).toMatchSnapshot();
    });
  });
  describe('selectSshKey', () => {
    it('should create a proper query', () => {
      const ret = Sql.selectSshKey(1);
      expect(ret).toMatchSnapshot();
    });
  });
});
