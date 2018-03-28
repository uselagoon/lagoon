const { Sql } = require('./notification');

describe('Sql', () => {
  describe('selectNotificationsByTypeByProjectId', () => {
    it('should create statement for notification_slack table', () => {
      const cred = {
        role: 'user',
        permissions: { customers: [], projects: [] },
      };

      const input = {
        type: 'slack',
        pid: 3,
      };
      const ret = Sql.selectNotificationsByTypeByProjectId(cred, input);
      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectUnassignedNotificationsByType', () => {
    it('should create a proper query', () => {
      const cred = {
        role: 'user',
        permissions: {
          customers: ['1', '2'],
          projects: [],
        },
      };
      const ret = Sql.selectUnassignedNotificationsByType(cred, 'rocketchat');
      expect(ret).toMatchSnapshot();
    });
  });

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
