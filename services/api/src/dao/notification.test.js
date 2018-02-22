const { Sql } = require('./notification');

describe('Sql', () => {
  describe('updateNotificationSlack', () => {
    it('should create a proper query', () => {
      const cred = {};
      const input = {
        name: 'n1',
        patch: {
          name: 'test',
          webhook: 'new-webhook',
        },
      };

      const ret = Sql.updateNotificationSlack(cred, input);
      expect(ret).toMatchSnapshot();
    });
  });
  describe('selectCustomer', () => {
    it('should create a proper query', () => {
      const ret = Sql.selectNotificationSlackByName('n1');
      expect(ret).toMatchSnapshot();
    });
  });
});
