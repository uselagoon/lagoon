// @flow

const jwt = require('jsonwebtoken');
const { createJWT, extractBase64Key, validateSshKey } = require('../jwt');

const testSsh =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC5b9Awb6iwWRz1z+QDwLlSvtpxg/7pR7Rf+kJT3khQGiLuX4Qk2aDCrt1fKndjyUuj55ocRc8OlExrA8FPfZbpnfaNXfVh9TlybhjIWUHtLbc9giCoDuiV2TEb6ZW/esKlVtWomzfY/njwPAuXEU2i3j5YxVQuZ0y+AN4yca4V1y7y2BlUOvp5qSvz/8PcBJegaoesSSuFpQWCR788/i0sURJiaG6+tZN+bGVSnJgtbXQJvc0r45au3PL5jyMcApbHOCDQUIiWyC6ipW2EIYTUBVO80QVEjymmBZpZEQl/0DQPEzBdqCi4X4wmwhoan7hQJQ7dNdqmRL+W4L75yPNyngNgJVNTlIXOHXevpNskH//HUlwEp4WPHuT76BZT3cq1RCatn6iMsFiwpESk9xyDbEVPfxKAr77cRpFIHuJd7amDjTk7/KP0PTliO2ViCyjDudiajwNh7XmY0ZqYrhHI16ebTSESDslh0a0JlZvWlYa4xDBKtKwfINRrcrYmuYUzSF7wn7F1o45cHZ2kuftioOQhLNgx0LqztRMn3RBoeG3QHbxmv9WfO/0hHa4FdkQLErEdzEM9JR4WewRnh04dcjejX1daWKbo2X8ndaCc0BvdNDL/HpSgqfCnJ2Nlq4pM6Pomkvdp5wTWpZwCjDl08UgttAFrQwjYoBy9UpUmDQ== ansible-testing';

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
        'Invalid ssh-key public key format (should start with e.g. ssh-rsa)'
      )
    );
  });

  test(
    'should create token with expiration date via expiresIn argument',
    async () => {
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
    }
  );

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
