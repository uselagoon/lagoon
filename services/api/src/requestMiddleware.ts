import { Request, Response, NextFunction } from 'express';
import { logger } from './loggers/logger';

const { getClientIp } = require('@supercharge/request-ip');

export type RequestWithRequestData = Request & {
  ipAddress?: any;
};

const ipAddress = async (
  req: RequestWithRequestData,
  _res: Response,
  next: NextFunction
) => {
  try {
    const ipAddress = getClientIp(req);

    req.headers.ipAddress = ipAddress;
  } catch (e) {
    logger.warn(`Unable to gather request ip address: ${e.message}`);
  }

  next();
};

export const requestMiddleware = [ipAddress];
