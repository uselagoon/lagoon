// @flow

const getContext = require('./getContext');
const request = require('request-promise-native');
const jwt = require('jsonwebtoken');
const R = require('ramda');
const logger = require('./logger');

import type { SshKeys, Clients, SiteGroups, SiteGroup, Site } from './types';
import type { SiteGroupView, SiteView, ClientView } from './selectors';
import type { State } from './reducer';
import type { $Request, $Response, NextFunction } from 'express';

export type Role = 'none' | 'admin' | 'drush';

// Sourced from services/auth-server/src/jwt.js
export type TokenPayload = {
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

// A filter gets an entity and returns a new object with filtered attributes
// Used for mapping over and remove attributes of a list of entities
// e.g. R.map(cred.attributeFilters.site)(sites)
export type AttributeFilter<E> = (entity: E) => Object;

// Collection of AttributeFilters used in Credentials
export type AttributeFilters = {
  sitegroup?: AttributeFilter<SiteGroupView>,
  site?: AttributeFilter<SiteView>,
  client?: AttributeFilter<ClientView>,
};

export type Credentials = {
  clients: Array<string>,
  sitegroups: Array<string>,
  sites: Array<string>,
  role: Role,
  attributeFilters: AttributeFilters,

  // if this is defined, query filter will apply
  allowedQueries?: Array<string>,
};

// Filtering is based on Whitelisting certain attributes of entire Entity groups
// ... be vary that there is no consideration on subattribute entities (e.g. Slack), unless
// they are also part of the resulting AttributeFilter object (e.g. Site, SiteGroup,..)
//
// Also, AttributeFilter should only be used for filtering attributes
// of already fetched entity data... if you want to prohibit access to
// complete group s see `getCredentialsForEntities`
const createAttributeFilters = (role: Role): AttributeFilters => {
  let sitegroup;
  let site;
  let client;

  let createFilter = attr =>
    R.ifElse(
      // Note: we need id & siteGroupName to be able
      // to normalize data
      R.isNil,
      R.always(null),
      R.pick(attr)
    );

  if (role === 'drush') {
    // For attributes check the SiteGroupView type
    sitegroup = createFilter([
      // SiteGroup attributes
      'id',
      'git_url',
      'slack',

      // SiteGroupView attributes
      'siteGroupName',
    ]);

    // For attributes check the SiteView type
    site = createFilter([
      // Site attributes
      'id',
      'site_branch',
      'site_environment',
      'deploy_strategy',
      'webroot',
      'domains',

      // SiteView attributes
      'siteHost',
      'siteName',
      'jumpHost',
      'serverInfrastructure',
      'serverIdentifier',
      'serverNames',

      // Allow this is well for the
      // nested access
      'sitegroup',
    ]);
  }

  // Only pick filters which are defined
  return R.pick(['sitegroup', 'site', 'client'], {
    sitegroup,
    site,
    client,
  });
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
  entityType: 'client' | 'sitegroup' | 'site',
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

      // Drush users should be able to access all entities with read access... with a few exceptions
      if (role === 'drush') {
        // Drush users should generally not be allowed to access client information
        if (entityType === 'client') {
          return acc;
        }
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

// If this function return void, all queries are allowed
const createAllowedQueries = (role: Role): void | Array<string> => {
  if (role === 'drush') {
    return ['siteGroupByName'];
  }
};

const getCredentials = (
  sshKey: string,
  role: Role,
  state: State
): Credentials => {
  const clients = R.compose(
    clients => getCredentialsForEntities(sshKey, role, 'client', null, clients),
    R.pathOr({}, ['clientsFile', 'amazeeio_clients'])
  )(state);

  const siteGroupInClient = (sgName: string, sg: SiteGroup) =>
    R.contains(sg.client, clients);

  const sitegroups = R.compose(
    siteGroups =>
      getCredentialsForEntities(
        sshKey,
        role,
        'sitegroup',
        siteGroupInClient,
        siteGroups
      ),
    R.pathOr({}, ['siteGroupsFile', 'amazeeio_sitegroups'])
  )(state);

  const siteInSiteGroup = (siteName: string, site: Site) =>
    R.contains(site.sitegroup, sitegroups);

  const sites = R.compose(
    sites =>
      getCredentialsForEntities(sshKey, role, 'site', siteInSiteGroup, sites),
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
    attributeFilters: createAttributeFilters(role),
    allowedQueries: createAllowedQueries(role),
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
      logger.info(`Invalid token with aud attribute: "${aud || ''}"`);
      return res.status(500).send({
        errors: [{ message: 'Auth token audience mismatch' }],
      });
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
  createAllowedQueries,
  createAttributeFilters,
  getCredentialsForEntities,
  getCredentials,
  createAuthMiddleware,
};
