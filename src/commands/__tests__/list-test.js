// @flow

import { runGQLQuery } from '../../query';
import { listSites } from '../list';

jest.mock('../../query');

const _mock = (mockFn: any): JestMockFn => mockFn;

const mockResponse = {
  data: {
    siteGroupByName: {
      sites: {
        edges: [
          {
            node: { siteName: 'site1' },
          },
          {
            node: { siteName: 'site2' },
          },
        ],
      },
    },
  },
};

describe('listSites', () => {
  it('should list sites as given by GraphQL', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve(mockResponse));

    const clog = jest.fn();

    const code = await listSites({
      sitegroup: 'some_sitegroup',
      clog,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show error message if GraphQL returns errors', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve({
      errors: [{ message: 'Something, something missing parameter X' }],
    }));

    const clog = jest.fn();

    const code = await listSites({
      sitegroup: 'some_sitegroup',
      clog,
    });

    expect(code).toBe(1);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show message for non-existing sites', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve({}));

    const clog = jest.fn();

    const code = await listSites({
      sitegroup: 'some_sitegroup',
      clog,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
