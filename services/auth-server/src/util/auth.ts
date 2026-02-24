import JWT from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

const { JWTSECRET, JWTAUDIENCE } = process.env;

const parseBearerToken = (header: string | undefined): string | null => {
  const parts = (header || '').split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
};

export const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = parseBearerToken(req.get('Authorization'));

  if (token == null) {
    logger.debug('No Bearer Token');
    return res
      .status(401)
      .send({ errors: [{ message: 'Unauthorized - Bearer Token Required' }] });
  }

  try {
    const decoded = JWT.verify(token, JWTSECRET);

    if (decoded == null || typeof decoded === 'string') {
      throw new Error('Decoding token resulted in wrong format.');
    }

    const { aud } = decoded;

    if (JWTAUDIENCE && aud !== JWTAUDIENCE) {
      logger.info(`Invalid token with aud attribute: "${aud || ''}"`);
      throw new Error('Token audience mismatch.');
    }

    const { role = 'none' } = decoded;

    if (role !== 'admin') {
      throw new Error('Cannot authenticate non-admin user with legacy token.');
    }

    next();
  } catch (e) {
    return res.status(403).send({
      errors: [{ message: `Forbidden - Invalid Auth Token: ${e.message}` }],
    });
  }
};
