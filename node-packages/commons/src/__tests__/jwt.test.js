// @flow

const jwt = require('jsonwebtoken');
const { createJWT, extractBase64Key, validateSshKey } = require('../jwt');

const testSsh =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw== ansible-testing';

describe('createJWT', () => {
  test('should create token properly', async () => {
    const input = {
      payload: {
        sshKey: testSsh,
        role: 'admin',
        iat: 1503014400000,
        iss: 'jest',
      },
      jwtSecret: 'secret',
    };

    const token = await createJWT(input);

    expect(token).toMatchSnapshot();
  });

  test('should throw an error on invalid ssh-key format', () => {
    const input = {
      payload: {
        sshKey: 'ssh-rsa invalid',
        role: 'admin',
        iat: 1503014400000,
        iss: 'jest',
      },
      jwtSecret: 'secret',
    };

    expect(createJWT(input)).rejects.toEqual(
      new Error(
        'Invalid ssh-key public key format (should start with e.g. ssh-rsa)',
      ),
    );
  });

  test('should create token with expiration date via expiresIn argument', async () => {
    const hour = 3600;
    const currentTime = Math.floor(Date.now() / 1000);

    const input = {
      payload: {
        sshKey: testSsh,
        role: 'admin',
        iat: currentTime,
        iss: 'jest',
      },
      jwtSecret: 'secret',
      expiresIn: '1h',
    };

    const token = await createJWT(input);
    const p = jwt.verify(token, 'secret');

    expect(p.exp).toEqual(currentTime + hour);
  });

  test('should create expired token, which should be reckognized by verify()', async () => {
    const input = {
      payload: {
        sshKey: testSsh,
        role: 'admin',
        iat: 1503014400, // way back in the past
        iss: 'jest',
      },
      jwtSecret: 'secret',
      expiresIn: '1h',
    };

    const token = await createJWT(input);
    const fn = () => jwt.verify(token, 'secret');

    expect(fn).toThrow(new Error('jwt expired'));
  });
});

describe('extractBase64Key', () => {
  test('should extract the base64 hash correctly from ssh-rsa', () => {
    const key = 'ssh-rsa base64 comment';

    expect(extractBase64Key(key)).toEqual('base64');
  });

  test('should return undefined if there was no base64 key found', () => {
    expect(extractBase64Key('ssh-rsa')).toBeUndefined();
    expect(extractBase64Key('')).toBeUndefined();
    expect(extractBase64Key((null: any))).toBeUndefined();
  });
});

describe('validateSshKey', () => {
  test('should return true on valid ssh key format', () => {
    const ret = validateSshKey(testSsh);
    expect(ret).toBeTruthy();
  });

  test('should return false on invalid format', () => {
    expect(validateSshKey('invalid')).toBeFalsy();
    expect(validateSshKey('ssh-rsa foo')).toBeFalsy();
    expect(validateSshKey('ssh-rsa foo== comment')).toBeFalsy();
  });
});
