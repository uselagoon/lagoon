// @flow

import type { SiteGroup } from './types';

import Lokka from 'lokka';
import Transport from 'lokka-transport-http';

const amazeeioapihost = process.env.AMAZEEIO_API_HOST || "https://api.amazeeio.cloud"

const graphqlapi = new Lokka({
  transport: new Transport(`${amazeeioapihost}/graphql`)
});

export class SiteGroupNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiteGroupNotFound';
  }
}

export class NoActiveSystemsDefined extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoActiveSystemsDefined';
  }
}


export async function siteGroupByGitUrl (gitUrl: string): SiteGroup {

  const result = await graphqlapi.query(`
    {
      siteGroup:siteGroupByGitUrl(giturl: "${gitUrl}"){
        siteGroupName
        slack
        openshift
      }
    }
  `)

  if (result.siteGroup != null) {
    return result.siteGroup
  } else {
    throw new SiteGroupNotFound(`Cannot find site information for git repo ${gitUrl}`)
  }
}

export async function getSiteGroupsByGitUrl (gitUrl: string): SiteGroup[] {

  const result = await graphqlapi.query(`
    {
      allSiteGroups(giturl: "${gitUrl}") {
        edges {
          node {
            siteGroupName
            slack
            openshift
          }
        }
      }
    }
  `)

  if (result.allSiteGroups.edges.length != 0) {
    // graphql returns multiple sitegroups in an array all with the key 'node`, we remove this here and make it a direct array with sitegroups
    return result.allSiteGroups.edges.map((edge) => edge.node)
  } else {
    throw new SiteGroupNotFound(`Cannot find site information for git repo ${gitUrl}`)
  }
}

export async function getSlackinfoForSiteGroup (siteGroup: string): SiteGroup {

  const result = await graphqlapi.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroup}"){
        slack
      }
    }
  `)

  if (result.siteGroup.slack) {
    return result.siteGroup
  } else {
    throw new SiteGroupNotFound(`Cannot find site information for siteGroup ${siteGroup}`)
  }
}

export async function getActiveSystemsForSiteGroup (siteGroup: string, task: string): String {

  const result = await graphqlapi.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroup}"){
        activeSystems
      }
    }
  `)

  if (result.siteGroup != null) {
    if (result.siteGroup.hasOwnProperty('activeSystems')) {
      return result.siteGroup.activeSystems
    } else {
      throw new NoActiveSystemsDefined(`Cannot find active systems for siteGroup ${siteGroup}`)
    }
  } else {
    throw new SiteGroupNotFound(`Cannot find SiteGroup: ${siteGroup}`)
  }
}
