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
  let customer;

  let createFilter = attr =>
    R.ifElse(
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
  return R.pick(['project', 'site', 'customer'], {
    project,
    site,
    customer,
  });
};

const createAuthMiddleware = args => async (req, res, next) => {
  const { baseUri, jwtSecret, jwtAudience } = args;
  const ctx = req.app.get('context');
  const dao = ctx.dao;

  const token = parseBearerToken(req.get('Authorization'));

  if (!token) {
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

    // We need this, since non-admin credentials are required to have an ssh-key
    const permissions = {};
    let nonAdminCreds = { permissions };

    if (role !== 'admin') {
      const permissions = await dao.getPermissions({ sshKey });

      if (permissions == null) {
        res
          .status(401)
          .send({ errors: [{ message: 'Unauthorized - Unknown SSH key' }] });
        return;
      }

      nonAdminCreds = {
        sshKey,
        permissions, // for read & write
      };

    }

    req.credentials = {
      role,
      ...nonAdminCreds,
    };

    next();
  } catch (e) {
    res
      .status(403)
      .send({ errors: [{ message: 'Forbidden - Invalid Auth Token' }] });
  }
};

module.exports = {
  createAuthMiddleware,
};
