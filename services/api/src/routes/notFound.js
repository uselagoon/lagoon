// @flow

import type { $Request, $Response } from 'express';

const notFoundRoute = (req: $Request, res: $Response) =>
  res.status(404).json({
    status: 'error',
    message: `No endpoint exists at ${req.originalUrl} (method: ${req.method})`,
  });

export default [notFoundRoute];
