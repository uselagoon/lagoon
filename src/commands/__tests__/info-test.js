// @flow

import { runGQLQuery } from '../../query';
import { siteInfo } from '../info';

jest.mock('../../query');

const _mock = (mockFn: any): JestMockFn => mockFn;

// Case for testing ambiguous sitenames
const mockResponse1 = {
  data: {
    siteGroupByName: {
      sites: {
        edges: [
          {
            node: {
              siteName: 'site1',
              siteBranch: 'dev',
            },
          },
          {
            node: {
              siteName: 'site1',
              siteBranch: 'prod',
            },
          },
        ],
      },
    },
  },
};

// Testdata for proper
const mockResponse2 = {
  data: {
    siteGroupByName: {
      sites: {
        edges: [
          {
            node: {
              siteName: 'site1',
              siteBranch: 'dev',
              siteEnvironment: 'development',
              uid: 'uid',
              serverNames: ['servername1'],
              webRoot: 'webroot',
              domains: ['domain1', 'domain2'],
              redirectDomains: ['redomain1', 'redomain2'],
              SSLCertificateType: 'sslcerttype',
              cron: { type: 'cron', minute: 0 },
              solrEnabled: false,
            },
          },
          {
            node: {
              siteName: 'site2',
              siteBranch: 'prod',
            },
          },
        ],
      },
    },
  },
};

const mockResponse3 = {
  errors: [
    { message: 'something something error' },
  ],
};

describe('siteInfo', () => {
  it('should detect ambiguity and propose more specific parameters', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve(mockResponse1));

    const clog = jest.fn();

    const code = await siteInfo({
      sitegroup: 'some_sitegroup',
      site: 'site1',
      clog,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL sends error messages', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve(mockResponse3));

    const clog = jest.fn();

    const code = await siteInfo({
      sitegroup: 'some_sitegroup',
      site: 'not_existing',
      clog,
    });

    expect(code).toBe(1);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should show table with information about sitegroup', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve(mockResponse2));

    const clog = jest.fn();

    const code = await siteInfo({
      sitegroup: 'some_sitegroup',
      site: 'site1',
      branch: 'dev',
      clog,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});

