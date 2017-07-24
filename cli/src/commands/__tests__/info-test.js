// @flow

import { runGQLQuery } from '../../query';
import { siteInfo, sitegroupInfo } from '../info';

jest.mock('../../query');

const _mock = (mockFn: any): JestMockFn => mockFn;

const mockErrorResponse = {
  errors: [{ message: 'something something error' }],
};

describe('siteGroupInfo', () => {
  const mockResponse1 = {
    data: {
      siteGroupByName: {
        gitUrl: 'sitegroup.git',
        siteGroupName: 'mysitegroup',
        slack: {
          webhook: 'https://slack-webhook.something',
          channel: 'myslack',
        },
        client: {
          clientName: 'me',
        },
        sites: [
          {
            siteName: 'site1',
            siteBranch: 'dev',
          },
          {
            siteName: 'site1',
            siteBranch: 'prod',
          },
        ],
      },
    },
  };

  it('should display error, if GraphQL sends error messages', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockErrorResponse),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await sitegroupInfo({
      sitegroup: 'some_sitegroup',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show error on missing sitegroup', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() => Promise.resolve({}));

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await sitegroupInfo({
      sitegroup: 'not_existing',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should list found information for given sitegroup', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockResponse1),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await sitegroupInfo({
      sitegroup: 'mysitegroup',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});

describe('siteInfo', () => {
  // Case for testing ambiguous sitenames
  const mockResponse1 = {
    data: {
      siteGroupByName: {
        sites: [
          {
            siteName: 'site1',
            siteBranch: 'dev',
          },
          {
            siteName: 'site1',
            siteBranch: 'prod',
          },
        ],
      },
    },
  };

  // Testdata for proper response without ambiguity
  const mockResponse2 = {
    data: {
      siteGroupByName: {
        sites: [
          {
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
          {
            siteName: 'site2',
            siteBranch: 'prod',
          },
        ],
      },
    },
  };

  it('should detect ambiguity and propose more specific parameters', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockResponse1),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await siteInfo({
      sitegroup: 'some_sitegroup',
      site: 'site1',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });

  it('should display error, if GraphQL sends error messages', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockErrorResponse),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await siteInfo({
      sitegroup: 'some_sitegroup',
      site: 'not_existing',
      clog,
      cerr,
    });

    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should show table with information about sitegroup', async () => {
    _mock(runGQLQuery).mockImplementationOnce(() =>
      Promise.resolve(mockResponse2),
    );

    const clog = jest.fn();
    const cerr = jest.fn();

    const code = await siteInfo({
      sitegroup: 'some_sitegroup',
      site: 'site1',
      branch: 'dev',
      clog,
      cerr,
    });

    expect(code).toBe(0);
    expect(clog.mock.calls).toMatchSnapshot();
  });
});
