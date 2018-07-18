const { Sql } = require('./notification');

describe('Sql', () => {
  describe('selectAssignedProjectNotificationByName', () => {
    it('should create proper statement', () => {
      const cred = {};
      const input = { name: 'slack_foo', type: 'slack' };
      const ret = Sql.selectProjectNotificationByNotificationName(cred, input);
      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectProjectNotificationsWithoutAccess', () => {
    it('should create a proper statement', () => {
      const cred = {
        permissions: {
          projects: ['3', '4'],
        },
      };

      const nids = ['1'];
      const ret = Sql.selectProjectNotificationsWithoutAccess(cred, { nids });
      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectNotificationsByTypeByProjectId', () => {
    it('if user, should create statement for notification_slack table with IN clause', () => {
      const cred = {
        role: 'user',
        permissions: { customers: [], projects: ['3'] },
      };

      const input = {
        type: 'slack',
        pid: 3,
      };

      const ret = Sql.selectNotificationsByTypeByProjectId(cred, input);
      expect(ret).toMatchSnapshot();
    });

    it('if admin, should create statement for notification_slack table without IN clause', () => {
      const cred = {
        role: 'admin',
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

  describe('deleteProjectNotification', () => {
    it('if not admin, should insert IN clause for project', () => {
      const cred = {
        role: 'user',
        permissions: {
          customers: [],
          projects: ['1'],
        },
      };

      const input = {
        project: 'some_project',
        notificationType: 'slack',
        notificationName: 'some_slack',
      };

      const ret = Sql.deleteProjectNotification(cred, input);
      expect(ret).toMatchSnapshot();
    });
  });
});
