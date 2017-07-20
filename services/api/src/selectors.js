// @flow

import type {
  Client,
  Site,
  SiteFile,
  SiteGroup,
  SshKey,
  SshKeys,
  State,
} from './types';

const R = require('ramda');

// ==== View Types

/**
* View Types only used as return types for selectors.
* Most of the time they are only extending specific domain
* types (types representing yaml related content) w/ extra
* computanional values
**/

// TODO: Type spread is broken for autocompletion for some reason >:(
export type ClientView = Client & {
  clientName: string,
};

export type SiteGroupView = SiteGroup & {
  siteGroupName: string,
};

export type SiteView = Site & {
  id: string,
  jumpHost: string,
  siteName: string,
  siteHost: string,
  fileName: string,
  serverInfrastructure: string,
  serverIdentifier: string,
  serverNames: Array<string>,
};

type FilterCriteria = {
  [key: string]: Function | mixed,
};

type WhereCriteria = {
  [key: string]: Function,
};

// ==== Utility

// Removes undefined / null criteria and transforms values to R.equals conditions
const sanitizeCriteria /*: (FilterCriteria) => WhereCriteria */ = R.compose(
  R.fromPairs,
  R.map(([key, val]) => [
    key,
    R.ifElse(
      R.is(Function),
      // Functions are already predicates
      R.identity,
      // otherwise make a predicate out of the value
      R.always(R.equals(val)),
    )(val),
  ]),
  R.toPairs,
  R.pickBy(R.compose(R.not, R.isNil)),
);

// A util to sanitize criteria before applying it to a where condition
const whereCriteria /* : (FilterCriteria) => Function */ = R.compose(
  R.where,
  sanitizeCriteria,
);

const findAll = (criteria: FilterCriteria) => R.filter(whereCriteria(criteria));

const findFirst = (criteria: FilterCriteria) => R.find(whereCriteria(criteria));

// ==== Selectors
const serverNamesLens = R.lensProp('serverNames');

const parseServerInfo = (
  fileName: string,
): {
  fileName: string,
  serverInfrastructure: string,
  serverIdentifier: string,
} =>
  R.compose(
    R.ifElse(
      R.isEmpty,
      () => null,
      matches => ({
        fileName,
        serverInfrastructure: matches[1],
        serverIdentifier: matches[2],
      }),
    ),
    R.match(/([^/]+)\/([^/.]+)\.[^/.]+$/),
    R.defaultTo(''),
  )(fileName);

const addServerInfo /* :
  <T: {
    fileName: string
  }> (T) => T & {
    serverInfrastructure?: string,
    serverIdentifier?: string,
  } */ = obj =>
  R.compose(
    R.ifElse(R.isNil, () => obj, R.merge(obj)),
    R.compose(parseServerInfo, R.prop('fileName')),
  )(obj);

// TODO: For now, if not all parameters are provided, the
//       function will return an empty string... not sure if
//       this is a good behavior
const toSiteHostStr /* :
  <T: {
  serverIdentifier: string,
  serverInfrastructure: string}
  >(T) => T */ = R.compose(
  R.ifElse(
    R.compose(
      // (val) => val.length > 1,
      R.lt(1),
      R.length,
    ),
    R.join('.'),
    R.compose(R.always('')),
  ),
  R.values,
  R.pick(['serverIdentifier', 'serverInfrastructure']),
);

const addSiteHost = (
  // ==> SiteFile -> amazeeio::servername
  servername: null | string | Array<string>,
  site: SiteView & { serverIdentifier: string, serverInfrastructure: string },
): SiteView =>
  R.compose(obj =>
    R.cond([
      [
        // servername comes from the upper context siteFile['amazeeio::servername']
        () => servername != null,
        R.set(R.lensProp('siteHost'), servername),
      ],
      [
        R.and(R.has('serverIdentifier'), R.has('serverInfrastructure')),
        R.set(R.lensProp('siteHost'), toSiteHostStr(obj)),
      ],
      [R.T, R.identity],
    ])(obj),
  )(site);

const CLUSTER_MEMBER_KEY =
  'drupalhosting::profiles::nginx_backend::cluster_member';

const clusterServerNames = (
  siteHost: string,
  clusterMembers: { [string]: string },
) =>
  R.compose(R.map(([key]) => `${key}.${siteHost}`), R.toPairs)(clusterMembers);

// Adds the computed 'serverNames' attribute to given SiteView object
const addServerNames = (
  // ==> SiteFile -> drupalhosting::profiles::nginx_backend::cluster_member
  clusterMembers: ?{ [string]: string },
  site: SiteView,
): SiteView =>
  R.cond([
    // Case 1 - If obj represents cluster information
    [
      R.compose(R.equals('cluster'), R.prop('serverInfrastructure')),
      obj =>
        R.set(
          serverNamesLens,
          clusterServerNames(obj.siteHost, clusterMembers || {}),
          obj,
        ),
    ],

    // Case 2 - If obj represents single instances
    [
      R.compose(R.equals('single'), R.prop('serverInfrastructure')),
      obj => R.set(serverNamesLens, [`backend.${obj.siteHost}`], obj),
    ],

    // Case 3 - use siteHost as serverNames instead
    [
      R.T,
      obj =>
        R.compose(
          serverNames => R.set(serverNamesLens, serverNames, obj),
          R.ifElse(
            R.compose(R.is(Array), R.prop('siteHost')),
            R.prop('siteHost'),
            R.compose(R.of, R.prop('siteHost')),
          ),
        )(obj),
    ],
  ])(site);

const maybeAddJumpHostKey = (jumpHost?: string, obj: Object): Object =>
  R.ifElse(
    () => R.isNil(jumpHost),
    () => R.identity(obj),
    () => R.set(R.lensProp('jumpHost'), jumpHost, obj),
  )(obj);

const extractSshKeys: ({ +ssh_keys?: SshKeys }) => Array<SshKey> = R.compose(
  R.ifElse(R.isEmpty, R.always([]), R.identity),
  R.map(value => `${value.type || 'ssh-rsa'} ${value.key}`),
  R.filter(value => R.has('key', value)),
  // -> Array<SshKey>
  R.map(R.prop(1)),
  Object.entries,
  R.propOr({}, 'ssh_keys'),
);

const getSshKeysFromClients /* State => Array<string> */ = R.compose(
  R.flatten,
  R.map(extractSshKeys),
);

const getAllSiteGroups /* : (State) => Array<SiteGroupView> */ = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, siteGroupName: id })),
  Object.entries,
  R.pathOr({}, ['siteGroupsFile', 'amazeeio_sitegroups']),
);

const filterSiteGroups = (
  criteria: FilterCriteria,
  state: State,
): Array<SiteGroupView> =>
  R.compose(findAll(criteria), getAllSiteGroups)(state);

const findSiteGroup = (criteria: FilterCriteria, state: State): SiteGroupView =>
  R.compose(findFirst(criteria), getAllSiteGroups)(state);

// Utility for converting actual siteFile content w/ fileName to a SiteView object
const siteFileToSiteViews = (
  fileName: string,
  siteFile: SiteFile,
): Array<SiteView> =>
  R.compose(
    R.map(site =>
      R.apply(addServerNames, [R.prop(CLUSTER_MEMBER_KEY, siteFile), site]),
    ),
    R.map(site =>
      R.apply(addSiteHost, [R.prop('amazeeio::servername', siteFile), site]),
    ),
    R.map(site =>
      R.assoc(
        'id',
        `${site.serverIdentifier}.${site.serverInfrastructure}/${site.siteName}`,
        site,
      ),
    ),
    R.map(addServerInfo),
    R.map(site =>
      R.apply(maybeAddJumpHostKey, [
        R.prop('amazeeio::jumphost', siteFile),
        site,
      ]),
    ),
    // -> Array<SiteView>
    // Add siteFile related information in each site object
    R.map(([siteName, site]) =>
      R.merge(site, {
        fileName,
        siteName,
      }),
    ),
    R.toPairs,
    R.prop('drupalsites'),
  )(siteFile);

// TODO: ADD TESTS
const getAllSites /* : (State) => Array<SiteView> */ = R.compose(
  R.flatten,
  // Create SiteView objects from all siteFiles w/ it's fileName
  R.map(([fileName, siteFile]) => siteFileToSiteViews(fileName, siteFile)),
  // Get all names and yaml contents of all files
  R.toPairs,
  R.propOr({}, 'siteFiles'),
);

const filterSites = (criteria: FilterCriteria, state: State): Array<SiteView> =>
  R.compose(findAll(criteria), getAllSites)(state);

const findSite = (criteria: FilterCriteria, state: State): SiteView =>
  R.compose(findFirst(criteria), getAllSites)(state);

const getAllClients /* : (State) => Array<ClientView> */ = R.compose(
  R.map(([id, client]) => ({ ...client, clientName: id })),
  Object.entries,
  R.pathOr({}, ['clientsFile', 'amazeeio_clients']),
);

const filterClients = (
  criteria: FilterCriteria,
  state: State,
): Array<ClientView> => R.compose(findAll(criteria), getAllClients)(state);

const findClient = (criteria: FilterCriteria, state: State): ClientView =>
  R.compose(findFirst(criteria), getAllClients)(state);

module.exports = {
  getAllSiteGroups,
  filterSiteGroups,
  findSiteGroup,
  getAllClients,
  filterClients,
  findClient,
  getAllSites,
  filterSites,
  findSite,
  sanitizeCriteria,
  maybeAddJumpHostKey,
  getSshKeysFromClients,
  extractSshKeys,
  siteFileToSiteViews,
  toSiteHostStr,
  addServerInfo,
  addServerNames,
  addSiteHost,
};
