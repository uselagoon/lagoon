import { getGroupProjectOrganizationAssociation } from './resolvers';
import { Helpers as organizationHelpers } from './helpers';
import { Helpers as groupHelpers } from '../group/helpers';
import { Helpers as projectHelpers } from '../project/helpers';

jest.mock('../../clients/pubSub', () => ({
  EVENTS: {
    ORGPROJECT: 'api.subscription.orgproject',
  },
  createOrganizationFilteredSubscriber: jest.fn(() => ({})),
}));

jest.mock('./helpers', () => ({
  Helpers: jest.fn(),
}));

jest.mock('../group/helpers', () => ({
  Helpers: jest.fn(),
}));

jest.mock('../project/helpers', () => ({
  Helpers: jest.fn(),
}));

describe('Organization resolvers', () => {
  describe('getGroupProjectOrganizationAssociation', () => {
    const sqlClientPool = {} as any;
    const group = {
      id: 'group-id',
      name: 'group-name',
    };
    const input = {
      organization: 1,
      id: group.id,
    };
    const hasPermission = jest.fn();
    const loadGroupByIdOrName = jest.fn();

    const runResolver = () =>
      getGroupProjectOrganizationAssociation(null, { input }, {
        sqlClientPool,
        hasPermission,
        models: {
          GroupModel: {
            loadGroupByIdOrName,
          },
        },
      } as any);

    beforeEach(() => {
      jest.clearAllMocks();
      hasPermission.mockResolvedValue(undefined);
      loadGroupByIdOrName.mockResolvedValue(group);
      (organizationHelpers as jest.Mock).mockReturnValue({
        getOrganizationById: jest
          .fn()
          .mockResolvedValue({ id: input.organization }),
      });
      (groupHelpers as jest.Mock).mockReturnValue({
        selectProjectIdsByGroupID: jest.fn().mockResolvedValue([]),
      });
      (projectHelpers as jest.Mock).mockReturnValue({
        getProjectByOrganizationId: jest.fn().mockResolvedValue([]),
      });
    });

    it('rejects a group with projects when the target organization has no projects', async () => {
      (groupHelpers as jest.Mock).mockReturnValue({
        selectProjectIdsByGroupID: jest.fn().mockResolvedValue([101]),
      });

      await expect(runResolver()).rejects.toThrow(
        'This organization has no projects associated to it, the following projects are not part of the requested organization: [101]',
      );
    });

    it('rejects a group with projects outside a non-empty target organization', async () => {
      (groupHelpers as jest.Mock).mockReturnValue({
        selectProjectIdsByGroupID: jest.fn().mockResolvedValue([101, 202]),
      });
      (projectHelpers as jest.Mock).mockReturnValue({
        getProjectByOrganizationId: jest.fn().mockResolvedValue([{ id: 101 }]),
      });

      await expect(runResolver()).rejects.toThrow(
        'This group has the following projects that are not part of the requested organization: [202]',
      );
    });

    it('allows a group whose projects are all in the target organization', async () => {
      (groupHelpers as jest.Mock).mockReturnValue({
        selectProjectIdsByGroupID: jest.fn().mockResolvedValue([101, 202]),
      });
      (projectHelpers as jest.Mock).mockReturnValue({
        getProjectByOrganizationId: jest
          .fn()
          .mockResolvedValue([{ id: 101 }, { id: 202 }]),
      });

      await expect(runResolver()).resolves.toEqual('success');
    });
  });
});
