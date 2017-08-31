// @flow

const getContext = require('./getContext');
const request = require('request-promise-native');
const jwt = require('jsonwebtoken');
const R = require('ramda');
const logger = require('./logger');

import type { SshKeys, Clients, SiteGroups, SiteGroup, Site } from './types';
import type { State } from './reducer';
import type { $Request, $Response, NextFunction } from 'express';

export type Role = 'none' | 'admin' | 'drush';

// Sourced from services/auth-server/src/jwt.js
type TokenPayload = {
  sshKey: string,
  role: Role,
  iss: string,
  sub?: string,
  aud?: string,
  iat?: number,
  exp?: number,
};

const parseBearerToken /* : (?string) => ?string */ = R.compose(
  R.ifElse(
    splits =>
      R.length(splits) === 2 &&
      R.compose(R.toLower, R.defaultTo(''), R.head)(splits) === 'bearer',
    R.nth(1),
    R.always(null)
  ),
  R.split(' '),
  R.defaultTo('')
);

const decodeToken = (token: string, secret: string): ?TokenPayload => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (e) {
    return null;
  }
};

export type Credentials = {
  clients: Array<string>,
  sitegroups: Array<string>,
  sites: Array<string>,
  role: Role,
};

const hasSshKey = (sshKey: string, entity: { +ssh_keys?: SshKeys }) =>
  R.compose(
    R.compose(R.not, R.isEmpty),
    R.filter(v => v[1] && v[1].key === sshKey),
    R.toPairs,
    R.propOr({}, 'ssh_keys')
  )(entity);

const getCredentialsForEntities = (
  sshKey: string,
  role: Role,
  // used for resolving specific relations between entities
  relationCond: ?(entityName: string, entity: Object) => boolean,
  entities: { [id: string]: { +ssh_keys?: SshKeys } }
): Array<string> =>
  R.compose(
    R.reduce((acc, [entityName, entity]) => {
      // If there is an admin role, don't filter at all
      if (role === 'admin') {
        return R.append(entityName, acc);
      }

      if (hasSshKey(sshKey, entity)) {
        return R.append(entityName, acc);
      }

      if (relationCond && relationCond(entityName, entity)) {
        return R.append(entityName, acc);
      }

      return acc;
    }, []),
    R.toPairs
  )(entities);

const getCredentials = (
  sshKey: string,
  role: Role,
  state: State
): Credentials => {
  const clients = R.compose(
    clients => getCredentialsForEntities(sshKey, role, null, clients),
    R.pathOr({}, ['clientsFile', 'amazeeio_clients'])
  )(state);

  const siteGroupInClient = (sgName: string, sg: SiteGroup) =>
    R.contains(sg.client, clients);

  const sitegroups = R.compose(
    siteGroups =>
      getCredentialsForEntities(sshKey, role, siteGroupInClient, siteGroups),
    R.pathOr({}, ['siteGroupsFile', 'amazeeio_sitegroups'])
  )(state);

  const siteInSiteGroup = (siteName: string, site: Site) =>
    R.contains(site.sitegroup, sitegroups);

  const sites = R.compose(
    sites => getCredentialsForEntities(sshKey, role, siteInSiteGroup, sites),
    R.fromPairs,
    R.unnest,
    R.map(([fileName, siteFile]) =>
      R.compose(R.toPairs, R.propOr({}, 'drupalsites'))(siteFile)
    ),
    R.toPairs,
    R.propOr({}, 'siteFiles')
  )(state);

  return {
    clients,
    sitegroups,
    sites,
    role,
  };
};

export type AuthMiddlewareArgs = {
  baseUri: string,
  jwtSecret: string,
  jwtAudience?: string,
};

const createAuthMiddleware = (args: AuthMiddlewareArgs) => async (
  req: $Request,
  res: $Response,
  next: NextFunction
) => {
  const { baseUri, jwtSecret, jwtAudience } = args;
  const ctx = getContext(req);

  const token = parseBearerToken(req.get('Authorization'));

  if (token == null) {
    res
      .status(401)
      .send({ errors: [{ message: 'Unauthorized - Bearer Token Required' }] });
    return;
  }

  try {
    // TODO: Do we really need this verifictation check?

    // Check if our auth-server knows of this token
    // await request({
    //   uri: `${baseUri}/authenticate/${token}`,
    // });

    const decoded = decodeToken(token, jwtSecret);

    if (decoded == null) {
      res.status(500).send({
        errors: [
          {
            message: 'Error while decoding auth token',
          },
        ],
      });
      return;
    }

    const { sshKey, role = 'none', aud } = decoded;

    if (jwtAudience && aud !== jwtAudience) {
      logger.info(`Invalid token with aud attribute: "${aud || ''}"`)
      return res.status(500).send({
        errors: [
          { message: 'Auth token audience mismatch'}
        ]
      })
    }

    // Add credentials to request context
    const state = ctx.store.getState();
    const credentials = getCredentials(sshKey, role, state);

    // $FlowIgnore
    req.credentials = credentials;

    next();
  } catch (e) {
    res
      .status(403)
      .send({ errors: [{ message: 'Forbidden - Invalid Auth Token' }] });
  }
};

module.exports = {
  getCredentialsForEntities,
  getCredentials,
  createAuthMiddleware,
};
