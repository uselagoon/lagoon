// @flow

import type { SiteGroup } from './types';

import Lokka from 'lokka';
import Transport from 'lokka-transport-http';

const amazeeioapihost = process.env.AMAZEEIO_API_HOST || "http://api:3000"

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
      siteGroup:siteGroupByGitUrl(gitUrl: "${gitUrl}"){
        siteGroupName
        slack {
          webhook
          channel
        }
        openshift
      }
    }
  `)

  if (!result || !result.siteGroup) {
    throw new SiteGroupNotFound(`Cannot find site information for git repo ${gitUrl}`)
  }

  return result.siteGroup;
}

export async function getSiteGroupsByGitUrl(gitUrl: string): SiteGroup[] {

  const result = await graphqlapi.query(`
    {
      allSiteGroups(gitUrl: "${gitUrl}") {
        siteGroupName
        slack {
          webhook
          channel
        }
        openshift
      }
    }
  `);

  if (!result || !result.allSiteGroups || !result.allSiteGroups.length) {
    throw new SiteGroupNotFound(`Cannot find site information for git repo ${gitUrl}`)
  }

  return result.allSiteGroups;
}

export async function getSlackinfoForSiteGroup (siteGroup: string): SiteGroup {

  const result = await graphqlapi.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroup}"){
        slack {
          webhook
          channel
        }
      }
    }
  `)

  if (!result || !result.siteGroup || !result.siteGroup.slack) {
    throw new SiteGroupNotFound(`Cannot find site information for siteGroup ${siteGroup}`)
  }

  return result.siteGroup;
}

export async function getActiveSystemsForSiteGroup (siteGroup: string, task: string): String {

  const result = await graphqlapi.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroup}"){
        activeSystems
      }
    }
  `);

  if (!result || !result.siteGroup) {
    throw new SiteGroupNotFound(`Cannot find site information for siteGroup ${siteGroup}`);
  }

  if (!result.siteGroup.activeSystems){
    throw new NoActiveSystemsDefined(`Cannot find active systems for siteGroup ${siteGroup}`)
  }

  return result.siteGroup.activeSystems;
}
