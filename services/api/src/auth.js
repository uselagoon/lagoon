// @flow

const request = require('request-promise-native');
const jwt = require('jsonwebtoken');
const R = require('ramda');
const logger = require('./logger');

const parseBearerToken = R.compose(
  R.ifElse(
    splits =>
      R.length(splits) === 2 &&
      R.compose(R.toLower, R.defaultTo(''), R.head)(splits) === 'bearer',
    R.nth(1),
    R.always(null),
  ),
  R.split(' '),
  R.defaultTo(''),
);

const decodeToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (e) {
    return null;
  }
};

// Filtering is based on Whitelisting certain attributes of entire Entity groups
// ... be vary that there is no consideration on subattribute entities (e.g. Slack), unless
// they are also part of the resulting AttributeFilter object (e.g. Site, SiteGroup,..)
//
// Also, AttributeFilter should only be used for filtering attributes
// of already fetched entity data... if you want to prohibit access to
// complete group s see `getCredentialsForEntities`
const createAttributeFilters = role => {
  let project;
  let site;
  let client;

  let createFilter = attr =>
    R.ifElse(
      // Note: we need id & siteGroupName to be able
      // to normalize data
      R.isNil,
      R.always(null),
      R.pick(attr),
    );

  if (role === 'drush') {
    // For attributes check the SiteGroupView type
    project = createFilter([
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
      'project',
    ]);
  }

  // Only pick filters which are defined
  return R.pick(['project', 'site', 'client'], {
    project,
    site,
    client,
  });
};

const hasSshKey = (sshKey, entity) =>
  R.compose(
    R.compose(R.not, R.isEmpty),
    R.filter(v => v[1] && v[1].key === sshKey),
    R.toPairs,
    R.propOr({}, 'ssh_keys'),
  )(entity);

const getCredentialsForEntities = (
  sshKey,
  role,
  entityType,
  // used for resolving specific relations between entities
  relationCond,
  entities,
) =>
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
    R.toPairs,
  )(entities);

// If this function return void, all queries are allowed
const createAllowedQueries = role => {
  if (role === 'drush') {
    return ['siteGroupByName'];
  }
};

const getCredentials = (sshKey, role, state) => {
  const clients = R.compose(
    clients => getCredentialsForEntities(sshKey, role, 'client', null, clients),
    R.pathOr({}, ['clientsFile', 'amazeeio_clients']),
  )(state);

  const siteGroupInClient = (sgName, sg) => R.contains(sg.client, clients);

  const projects = R.compose(
    siteGroups =>
      getCredentialsForEntities(
        sshKey,
        role,
        'project',
        siteGroupInClient,
        siteGroups,
      ),
    R.pathOr({}, ['siteGroupsFile', 'amazeeio_projects']),
  )(state);

  const siteInSiteGroup = (siteName, site) =>
    R.contains(site.project, projects);

  const sites = R.compose(
    sites =>
      getCredentialsForEntities(sshKey, role, 'site', siteInSiteGroup, sites),
    R.fromPairs,
    R.unnest,
    R.map(([fileName, siteFile]) =>
      R.compose(R.toPairs, R.propOr({}, 'drupalsites'))(siteFile),
    ),
    R.toPairs,
    R.propOr({}, 'siteFiles'),
  )(state);

  return {
    clients,
    projects,
    sites,
    role,
    attributeFilters: createAttributeFilters(role),
    allowedQueries: createAllowedQueries(role),
  };
};

const createAuthMiddleware = args => async (req, res, next) => {
  const { baseUri, jwtSecret, jwtAudience } = args;
  const ctx = req.context;

  const token = parseBearerToken(req.get('Authorization'));

  if (token == null) {
    res
      .status(401)
      .send({ errors: [{ message: 'Unauthorized - Bearer Token Required' }] });
    return;
  }

  try {
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

    // $FlowIgnore
    req.credentials = decoded;

    next();
  } catch (e) {
    console.log(e);
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
