// @flow

const jwt = require('jsonwebtoken');
const { createJWT } = require('../jwt');

describe('createJWT', () => {
  test('should create token properly', async () => {
    const input = {
      payload: {
        userId: 0,
        role: 'admin',
        iat: 1503014400000,
        iss: 'jest',
      },
      jwtSecret: 'secret',
    };

    const token = await createJWT(input);
    const decodedPayload = jwt.verify(token, 'secret');

    expect(token).toMatchSnapshot();
    expect(decodedPayload).toEqual(input.payload);
  });

  test('should throw an error on invalid user id', () => {
    const input = {
      payload: {
        userId: 'invalid userId',
        role: 'admin',
        iat: 1503014400000,
        iss: 'jest',
      },
      jwtSecret: 'secret',
    };

    // $FlowFixMe This intentionally passes an incorrect format to createJWT
    expect(createJWT(input)).rejects.toEqual(
      new Error(
        'Incorrect userId parameter "invalid userId" passed (expecting a number)!',
      ),
    );
  });

  test('should create token with expiration date via expiresIn argument', async () => {
    const hour = 3600;
    const currentTime = Math.floor(Date.now() / 1000);

    const input = {
      payload: {
        userId: 0,
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
        userId: 0,
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
