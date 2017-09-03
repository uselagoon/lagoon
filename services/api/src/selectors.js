// @flow

import type { State } from './reducer';

import type {
  Client,
  Site,
  SiteFile,
  SiteGroup,
  SshKey,
  SshKeys,
} from './types';

import type { Credentials, Role, AttributeFilter } from './auth';

const R = require('ramda');

// ==== View Types

/**
* View Types only used as return types for selectors.
* Most of the time they are only extending specific domain
* types (types representing yaml related content) w/ extra
* computanional values
* */

export type SshKeyView = SshKey & {
  owner: string,
};

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
const sanitizeCriteria: FilterCriteria => WhereCriteria = R.compose(
  R.map(val =>
    R.ifElse(
      R.is(Function),
      // Functions are already predicates
      R.identity,
      // otherwise make a predicate out of the value
      R.always(R.equals(val))
    )(val)
  ),
  R.pickBy(R.compose(R.not, R.isNil))
);

// A util to sanitize criteria before applying it to a where condition
const whereCriteria: FilterCriteria => Function = R.compose(
  R.where,
  sanitizeCriteria
);

const findAll = (criteria: FilterCriteria) => R.filter(whereCriteria(criteria));

const findFirst = (criteria: FilterCriteria) => R.find(whereCriteria(criteria));

// ==== Selectors
const serverNamesLens = R.lensProp('serverNames');

const parseServerInfo = (fileName: string) =>
  R.compose(
    R.ifElse(
      R.isEmpty,
      () => null,
      matches => ({
        fileName,
        serverInfrastructure: matches[1],
        serverIdentifier: matches[2],
      })
    ),
    R.match(/([^/]+)\/([^/.]+)\.[^/.]+$/),
    R.defaultTo('')
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
    R.compose(parseServerInfo, R.prop('fileName'))
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
      R.length
    ),
    R.join('.'),
    R.compose(R.always(''))
  ),
  R.values,
  R.pick(['serverIdentifier', 'serverInfrastructure'])
);

const addSiteHost = (
  // ==> SiteFile -> amazeeio::servername
  servername: null | string | Array<string>,
  site: SiteView & { serverIdentifier: string, serverInfrastructure: string }
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
    ])(obj)
  )(site);

const computeServerNames: (obj: {
  serverInfrastructure?: string,
  siteHost: string,
  clusterMembers: ?{ [string]: string },
}) => Array<string> = R.cond([
  // Case 1 - If obj represents cluster information
  [
    R.compose(R.equals('cluster'), R.prop('serverInfrastructure')),
    ({ clusterMembers, siteHost }) =>
      // map to [ "servername1", "servername2", ...]
      R.compose(
        // { backend1: 10.0.0.1 } => "backend1.mySiteHost"
        R.map(([key]) => `${key}.${siteHost}`),
        R.toPairs
      )(clusterMembers),
  ],

  // Case 2 - If obj represents single instances
  [
    R.compose(R.equals('single'), R.prop('serverInfrastructure')),
    obj => [`backend.${obj.siteHost}`],
  ],

  // Case 3 - use siteHost as serverNames instead
  [
    R.T,
    R.ifElse(
      R.compose(R.is(Array), R.prop('siteHost')),
      R.prop('siteHost'),
      R.compose(R.of, R.prop('siteHost'))
    ),
  ],
]);

// Adds the computed 'serverNames' attribute to given SiteView object
const addServerNames = (
  // ==> SiteFile -> drupalhosting::profiles::nginx_backend::cluster_member
  clusterMembers: ?{ [string]: string },
  site: SiteView
): SiteView =>
  R.set(
    serverNamesLens,
    computeServerNames({
      serverInfrastructure: site.serverInfrastructure,
      siteHost: site.siteHost,
      clusterMembers,
    }),
    site
  );

const maybeAddJumpHostKey = (jumpHost?: string, obj: Object): Object =>
  R.ifElse(
    () => R.isNil(jumpHost),
    () => R.identity(obj),
    () => R.set(R.lensProp('jumpHost'), jumpHost, obj)
  )(obj);

const toSshKeyStr = ({ type = 'ssh-rsa', key }: SshKey): string =>
  `${type} ${key}`;

const extractSshKeys: ({ +ssh_keys?: SshKeys }) => Array<
  SshKeyView
> = R.compose(
  // Add the missing owner attribute, making it a SshKeyView
  R.map(([owner, sshKey]) =>
    R.merge(sshKey, {
      owner,
      type: R.propOr('ssh-rsa', 'type', sshKey),
    })
  ),
  R.toPairs,
  R.propOr({}, 'ssh_keys')
);

const getSshKeysFromClients /* State => Array<SshKeyView> */ = R.compose(
  R.flatten,
  R.map(extractSshKeys)
);

const getAllSiteGroups /* : (State) => Array<SiteGroupView> */ = R.compose(
  R.map(([id, siteGroup]) =>
    Object.assign({}, siteGroup, { siteGroupName: id })
  ),
  Object.entries,
  R.pathOr({}, ['siteGroupsFile', 'amazeeio_sitegroups'])
);

const filterSiteGroups = (
  criteria: FilterCriteria,
  attributeFilter?: AttributeFilter<SiteGroupView> = R.identity(),
  state: State
): Array<SiteGroupView> =>
  R.compose(R.map(attributeFilter), findAll(criteria), getAllSiteGroups)(state);

const findSiteGroup = (
  criteria: FilterCriteria,
  attributeFilter?: AttributeFilter<SiteGroupView> = R.identity(),
  state: State
): SiteGroupView =>
  R.compose(
    attributeFilter,
    findFirst(criteria),
    getAllSiteGroups
  )(state);

// Utility for converting actual siteFile content w/ fileName to a SiteView object
const siteFileToSiteViews = (
  fileName: string,
  siteFile: SiteFile
): Array<SiteView> =>
  R.compose(
    R.map(site =>
      R.apply(addServerNames, [
        R.prop(
          'drupalhosting::profiles::nginx_backend::cluster_member',
          siteFile
        ),
        site,
      ])
    ),
    R.map(site =>
      R.apply(addSiteHost, [R.prop('amazeeio::servername', siteFile), site])
    ),
    R.map(site =>
      R.assoc(
        'id',
        `${site.serverIdentifier}.${site.serverInfrastructure}/${site.siteName}`,
        site
      )
    ),
    R.map(addServerInfo),
    R.map(site =>
      R.apply(maybeAddJumpHostKey, [
        R.prop('amazeeio::jumphost', siteFile),
        site,
      ])
    ),
    // -> Array<SiteView>
    // Add siteFile related information in each site object
    R.map(([siteName, site]) =>
      R.merge(site, {
        fileName,
        siteName,
      })
    ),
    R.toPairs,
    R.prop('drupalsites')
  )(siteFile);

// TODO: ADD TESTS
const getAllSites /* : (State) => Array<SiteView> */ = R.compose(
  R.flatten,
  // Create SiteView objects from all siteFiles w/ it's fileName
  R.map(([fileName, siteFile]) => siteFileToSiteViews(fileName, siteFile)),
  // Get all names and yaml contents of all files
  R.toPairs,
  R.propOr({}, 'siteFiles')
);

const filterSites = (
  criteria: FilterCriteria,
  attributeFilter?: AttributeFilter<SiteView> = R.identity(),
  state: State
): Array<SiteView> =>
  R.compose(R.map(attributeFilter), findAll(criteria), getAllSites)(state);

const findSite = (
  criteria: FilterCriteria,
  attributeFilter?: AttributeFilter<SiteView> = R.identity(),
  state: State
): SiteView =>
  R.compose(attributeFilter, findFirst(criteria), getAllSites)(state);

const getAllClients /* : (State) => Array<ClientView> */ = R.compose(
  R.map(([id, client]) => Object.assign({}, client, { clientName: id })),
  Object.entries,
  R.pathOr({}, ['clientsFile', 'amazeeio_clients'])
);

const filterClients = (
  criteria: FilterCriteria,
  state: State
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
  toSshKeyStr,
};
