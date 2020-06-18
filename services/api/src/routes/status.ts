import { Request, Response } from 'express';

const statusRoute = (req: Request, res: Response) => {
  // @todo Add logic to fetch the status.
  const status = {};

  res.json({ status: 'success', data: status });
};

export default [statusRoute];
