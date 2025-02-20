import jwt from 'jsonwebtoken';
import { createJWTWithoutUserId } from '../jwt';

describe('createJWT', () => {
  test('should create token properly', async () => {
    const { payload, jwtSecret } = {
      payload: {
        role: 'admin' as const,
        iat: 1503014400000,
        exp: 1503014400000,
        iss: 'jest'
      },
      jwtSecret: 'secret',
    };

    const token = await createJWTWithoutUserId(payload, jwtSecret);
    const decodedPayload = jwt.verify(token, jwtSecret);

    expect(token).toMatchSnapshot();
    expect(decodedPayload).toEqual(payload);
  });

  test('should create token with expiration date via expiresIn argument', async () => {
    const hour = 3600;
    const currentTime = Math.floor(Date.now() / 1000);

    const { payload, jwtSecret } = {
      payload: {
        role: 'admin' as const,
        iat: currentTime,
        exp: currentTime + hour,
        iss: 'jest',
      },
      jwtSecret: 'secret',
    };

    const token = await createJWTWithoutUserId(payload, jwtSecret);
    const decodedPayload = jwt.verify(token, jwtSecret);
    const exp = typeof decodedPayload === 'object' ? decodedPayload.exp : 'jwt verify error';

    expect(exp).toEqual(currentTime + hour);
  });

  test('should create expired token, which should be reckognized by verify()', async () => {
    const { payload, jwtSecret } = {
      payload: {
        userId: 0,
        permissions: {
          projects: [],
          customers: []
        },
        role: 'admin' as const,
        iat: 1503014400, // way back in the past
        exp: 1503018000,
        iss: 'jest',
      },
      jwtSecret: 'secret',
    };

    const token = await createJWTWithoutUserId(payload, jwtSecret);
    const fn = () => jwt.verify(token, jwtSecret);

    expect(fn).toThrow(new Error('jwt expired'));
  });
});
