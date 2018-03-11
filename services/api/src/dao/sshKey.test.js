const { Sql } = require('./sshKey');

describe('Sql', () => {
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
