// @ts-nocheck
// prevent uuid side-effects (this needs to called before any require statement)
jest.mock('uuid4', () => () => 'uuid');

import { extractWebhookData } from '../extractWebhookData';

it('should return github related webhook data', () => {
  const req = {
    method: 'POST',
    headers: {
      'x-github-event': 'gh',
      'x-github-delivery': '123',
    },
    url: 'url',
  };

  const body = {
    repository: {
      ssh_url: 'sshurl',
    },
  };

  const result = extractWebhookData(req, JSON.stringify(body));

  expect(result).toEqual({
    webhooktype: 'github',
    event: 'gh',
    uuid: '123',
    giturl: 'sshurl',
    body,
  });
});

it('should return gitlab related webhook data', () => {
  const req = {
    method: 'POST',
    headers: {
      'x-gitlab-event': 'something',
      'x-gitlab-delivery': '123',
    },
    url: 'url'
  };

  const body = JSON.stringify({
    object_kind: 'gl',
    project: {
      git_ssh_url: 'sshurl'
    }
  });

  const result = extractWebhookData(req, body);

  expect(result).toEqual({
    webhooktype: 'gitlab',
    event: 'gl',
    uuid: 'uuid',
    giturl: 'sshurl',
    body: {
      object_kind: 'gl',
      project: {
        git_ssh_url: 'sshurl'
      }
    },
  });
});

it('should return bitbucket related webhook data', () => {
  const req = {
    method: 'POST',
    headers: {
      'x-event-key': 'bb',
    },
    url: 'url',
  };

  const body = {
    repository: {
      links: {
        html: {
          href: 'https://bitbucket.org/teamawesome/repository',
        },
      },
      full_name: 'teamawesome/repository',
    },
  };

  const result = extractWebhookData(req, JSON.stringify(body));

  expect(result).toEqual({
    webhooktype: 'bitbucket',
    event: 'bb',
    giturl: 'git@bitbucket.org:teamawesome/repository.git',
    body,
  });
});

it('should throw an error on missing webhook header data', () => {
  const req = {
    method: 'POST',
    headers: {},
    url: 'url',
  };

  expect(() => extractWebhookData(req)).toThrow(
    'No supported event header found on POST request',
  );
});

it('should parse body on POST', () => {
  const req = {
    method: 'POST',
    headers: {
      'x-github-event': 'gh',
      'x-github-delivery': '123',
    },
    url: 'url',
  };

  const body = '{ "content": true }';

  const result = extractWebhookData(req, body);

  expect(result.body).toEqual({ content: true });
});

it('should throw on invalid POST body', () => {
  const req = {
    method: 'POST',
    headers: {
      'x-github-event': 'gh',
      'x-github-delivery': '123',
    },
    url: 'url',
  };

  const body = 'non-json';
  const fn = () => extractWebhookData(req, body);
  expect(fn).toThrow('request body is not parsable as JSON');
});

it('should return custom webhook data on GET (with x-sha)', () => {
  const req = {
    method: 'GET',
    headers: {},
    url: 'url?url=utest&branch=btest&sha=stest',
  };

  const result = extractWebhookData(req);

  expect(result).toEqual({
    webhooktype: 'custom',
    event: 'push',
    uuid: 'uuid',
    body: {
      url: 'utest',
      branch: 'btest',
      sha: 'stest',
    },
    giturl: 'url?url=utest&branch=btest&sha=stest',
  });
});

it('should return custom webhook data on GET (without x-sha)', () => {
  const req = {
    method: 'GET',
    headers: {},
    url: 'url?url=utest&branch=btest',
  };

  const result = extractWebhookData(req);

  expect(result).toEqual({
    webhooktype: 'custom',
    event: 'push',
    uuid: 'uuid',
    body: {
      url: 'utest',
      branch: 'btest',
      sha: '',
    },
    giturl: 'url?url=utest&branch=btest',
  });
});

it('should throw on missing url / branch query param on GET', () => {
  const req1 = {
    method: 'GET',
    headers: {},
    url: 'url?branch=btest',
  };

  const req2 = {
    method: 'GET',
    headers: {},
    url: 'url?url=utest',
  };

  expect(() => extractWebhookData(req1)).toThrowError(
    "Query param 'url' not found!",
  );
  expect(() => extractWebhookData(req2)).toThrowError(
    "Query param 'branch' not found!",
  );
});

it('should throw on empty url / branch query parameter on GET', () => {
  const req1 = {
    method: 'GET',
    headers: {},
    url: 'url?url=&branch=test',
  };

  const req2 = {
    method: 'GET',
    headers: {},
    url: 'url?url=test&branch=',
  };

  expect(() => extractWebhookData(req1)).toThrowError(
    "Query param 'url' is empty!",
  );
  expect(() => extractWebhookData(req2)).toThrowError(
    "Query param 'branch' is empty!",
  );
});

it('should throw on unknown http method', async () => {
  const req = {
    method: 'PUT',
    headers: {},
    url: 'url',
  };

  expect(() => extractWebhookData(req)).toThrow(
    'Unsupported request method: PUT',
  );
});
