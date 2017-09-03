// @flow

import type { $Request } from 'express';
import type { Credentials } from './auth';

module.exports = (req: $Request): Credentials => (req: any).credentials;
