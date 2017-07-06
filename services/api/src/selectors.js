// @flow

import type {
  SiteFile,
  SiteGroup,
  State,
  SiteFiles,
  Site,
  Client,
  SshKeys,
  SshKey,
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

export type SiteView = {
  ...Site,
  id: string,
  jumpHost: string,
  siteName: string,
  siteHost: string,
  fileName: string,
  serverInfrastructure: string,
  serverIdentifier: string,
  serverNames: Array<string>,
};

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
        fileName: fileName,
        serverInfrastructure: matches[1],
        serverIdentifier: matches[2],
      }),
    ),
    R.match(/([^/]+)\/([^/.]+)\.[^/.]+$/),
    R.defaultTo(''),
  )(fileName);

const addServerInfo /*:
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

const addSiteHost /*:
   <T: {
    serverIdentifier: string,
    serverInfrastructure: string}
    >(T) => T */ = R.compose(
  obj =>
    R.ifElse(
      R.and(R.has('serverIdentifier'), R.has('serverInfrastructure')),
      R.set(R.lensProp('siteHost'), toSiteHostStr(obj)),
      R.identity(),
    )(obj),
);

// TODO: For now, if not all parameters are provided, the
//       function will return an empty string... not sure if
//       this is a good behavior
const toSiteHostStr /*:
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

const CLUSTER_MEMBER_KEY =
  'drupalhosting::profiles::nginx_backend::cluster_member';

const clusterServerNames = (
  siteHost: string,
  clusterMember: { [string]: string },
) =>
  R.compose(R.map(([key]) => `${key}.${siteHost}`), R.toPairs)(clusterMember);

const addServerNames /*: 
    <T: {
      serverInfrastructure?: string,
      siteHost: string | Array<string>,
      'drupalhosting::profiles::nginx_backend::cluster_member'?: {
        [string]: string,
      },
      'amazeeio::servername'?: string | Array<string>
      }> (T) => {...T, serverNames: Array<string>} */ = R.cond(
  [
    // Case 1 - If obj represents cluster information
    [
      obj => R.equals('cluster', obj.serverInfrastructure),
      obj =>
        R.set(
          serverNamesLens,
          clusterServerNames(obj.siteHost, obj[CLUSTER_MEMBER_KEY]),
          obj,
        ),
    ],

    // Case 2 - If obj represents single instances
    [
      obj => R.equals('single', obj.serverInfrastructure),
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
  ],
);

const maybeAddJumpHostKey = (jumpHost?: string, obj: Object): Object =>
  R.ifElse(
    () => R.isNil(jumpHost),
    () => R.identity(obj),
    () => R.set(R.lensProp('jumpHost'), jumpHost, obj),
  )(obj);

const extractSshKeys /*: <T: { +ssh_keys?: SshKeys}>(T) => Array<SshKey> */ = R.compose(
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

const getAllSiteGroups /*: (State) => Array<SiteGroupView> */ = R.compose(
  R.map(([id, siteGroup]) => ({ ...siteGroup, siteGroupName: id })),
  Object.entries,
  R.pathOr({}, ['siteGroupsFile', 'amazeeio_sitegroups']),
);

// Utility for converting actual siteFile content w/ fileName to a SiteView object
const siteFileToSiteViews = (
  fileName: string,
  siteFile: SiteFile,
): Array<SiteView> =>
  R.compose(
    R.map(addServerNames),
    R.map(addSiteHost),
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

// TODO: ADD TESTS?
const getAllSites /*: (State) => Array<SiteView> */ = R.compose(
  R.flatten,
  // Create SiteView objects from all siteFiles w/ it's fileName
  R.map(([fileName, siteFile]) => siteFileToSiteViews(fileName, siteFile)),
  // Get all names and yaml contents of all files
  R.toPairs,
  R.propOr({}, 'siteFiles'),
);

const getAllSitesByEnv = (state: State, env: string): Array<SiteView> =>
  R.compose(
    // Filter sites that don't match the passed environment
    R.filter(siteV => siteV.site_environment === env),
    getAllSites,
  )(state);

const getAllSitesBySiteGroup = (
  state: State,
  siteGroupName: string,
): Array<SiteView> =>
  R.compose(R.filter(siteV => siteV.sitegroup === siteGroupName), getAllSites)(
    state,
  );

const getSiteByName = (state: State, name: string): ?Site =>
  R.compose(
    R.head,
    R.reduce(
      (acc, curr) => [
        ...acc,
        R.compose(
          R.last,
          R.find(([siteName, site]) => (siteName === name ? site : [])),
          R.toPairs,
        )(curr.drupalsites),
      ],
      [],
    ),
    R.values,
    R.propOr({}, 'siteFiles'),
  )(state);

const getAllClients /*: (State) => Array<ClientView> */ = R.compose(
  R.map(([id, client]) => ({ ...client, clientName: id })),
  Object.entries,
  R.pathOr({}, ['clientsFile', 'amazeeio_clients']),
);

const getClientByName = (state: State, name: string): ClientView =>
  R.compose(R.find(client => client.clientName === name), getAllClients)(state);

const getSiteGroupsByClient = (
  state: State,
  clientName: string,
): Array<ClientView> =>
  R.compose(
    R.filter(siteGroup => siteGroup.client === clientName),
    getAllSiteGroups,
  )(state);

// TODO: ADD TESTS FOR THIS
const getSiteGroupByName = (
  state: State,
  siteGroupName: string,
): Array<SiteGroupView> =>
  R.compose(
    R.filter(siteGroup => siteGroup.siteGroupName === siteGroupName),
    getAllSiteGroups,
  )(state);

module.exports = {
  getAllSiteGroups,
  getSiteByName,
  getAllSitesByEnv,
  getAllClients,
  getClientByName,
  getSiteGroupsByClient,
  getSshKeysFromClients,
  getAllSites,
  extractSshKeys,
  maybeAddJumpHostKey,
  addServerInfo,
  addServerNames,
  addSiteHost,
  siteFileToSiteViews,
  toSiteHostStr,
  getSiteGroupByName,
  getAllSites,
  getAllSitesBySiteGroup,
};
