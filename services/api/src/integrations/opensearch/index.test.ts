import {
  generateOpenSearchPayload,
  generateOpenSearchSettingsPayload
} from './';

describe('generateOpenSearchPayload', () => {
  test('empty tenant', () => {
    expect(generateOpenSearchPayload('data', '')).toStrictEqual({
      body: 'data'
    });
  });

  test('nil tenant', () => {
    expect(generateOpenSearchPayload('data')).toStrictEqual({
      body: 'data'
    });
  });

  test('random tenant', () => {
    expect(generateOpenSearchPayload('data', 'tenant-name')).toStrictEqual({
      body: 'data',
      headers: {
        securitytenant: 'tenant-name'
      }
    });
  });

  test('body object', () => {
    expect(
      generateOpenSearchPayload({ a: 'complex', object: { to: 'test' } })
    ).toStrictEqual({
      body: { a: 'complex', object: { to: 'test' } }
    });
  });
});

describe('generateOpenSearchSettingsPayload', () => {
  test('empty tenant', () => {
    expect(generateOpenSearchSettingsPayload('')).toStrictEqual({
      body: {
        changes: {
          defaultIndex: 'container-logs-*',
          'telemetry:optIn': false
        }
      }
    });
  });

  test('random tenant', () => {
    expect(generateOpenSearchSettingsPayload('tenant-name')).toStrictEqual({
      body: {
        changes: {
          defaultIndex: 'container-logs-*',
          'telemetry:optIn': false
        }
      },
      headers: {
        securitytenant: 'tenant-name'
      }
    });
  });
});
