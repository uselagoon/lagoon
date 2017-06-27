// @flow

const Yaml = require('js-yaml');
// const { readFile } = require('../util/fs');
const { listYamlFiles, readYamlFile } = require('.');

class Site {
  constructor(siteName, serverInfrastructure, serverIdentifier, serverNames, jumpHost, fullJson) {
    this.id = `${serverIdentifier}.${serverInfrastructure}/${siteName}`;
    this.siteHost = `${serverIdentifier}.${serverInfrastructure}`;
    this.created = fullJson.created;
    this.siteName = siteName;
    this.siteGroup = fullJson.sitegroup || null;
    this.siteBranch = fullJson.site_branch;
    this.siteEnvironment = fullJson.site_environment;
    this.serverIdentifier = serverIdentifier;
    this.serverInfrastructure = serverInfrastructure;
    this.serverNames = serverNames;
    this.webRoot = fullJson.webroot || '';
    this.drupalVersion = fullJson.drupal_version;
    this.SSLCertificateType = fullJson.sslcerttype;
    this.FPMProfile = fullJson.fpm_profile;
    this.domains = fullJson.domains;
    this.redirectDomains = fullJson.redict_domains;
    this.redirects = fullJson.redirects;
    this.uid = fullJson.uid;
    this.dbPassword = fullJson.db_password;
    this.dbUser = fullJson.db_user;
    this.cron = {};
    this.cron.type = fullJson.cron && fullJson.cron.type || null;
    this.cron.minute = fullJson.cron && fullJson.cron.minute || null;
    this.customCron = fullJson.custom_cron;
    this.envVariables = fullJson.env_variables;
    this.noPrefixenvVariables = fullJson.no_prefix_env_variables;
    this.phpValues = fullJson.php_values;
    this.phpAdminValues = fullJson.php_admin_values;
    this.phpFlags = fullJson.php_flags;
    this.phpAdminFlags = fullJson.php_admin_flags;
    this.xdebug = fullJson.xdebug;
    this.nginxSitespecific = fullJson.nginx_sitespecific;
    this.nginxSiteconfig = fullJson.nginx_siteconfig;
    this.solrEnabled = fullJson.solr_enabled;
    this.redisEnabled = fullJson.redis_enabled;
    this.sshKeys = fullJson.ssh_keys;
    this.phpVersion = fullJson.php_version;
    this.redirectToHttps = fullJson.redirect_to_https;
    this.ensure = fullJson.ensure;
    this.upstreamURL = fullJson.upstream_url;
    this.deployStrategy = fullJson.deploy_strategy || null;
    this.apc = fullJson.apc;
    this.comment = fullJson.comment;
    this.basicAuth = {};
    this.basicAuth.username = fullJson.basic_auth && fullJson.basic_auth.username || null;
    this.basicAuth.password = fullJson.basic_auth && fullJson.basic_auth.password || null;
    this.jumpHost = jumpHost;
    this.monitoringLevel = fullJson.monitoring_level || null;
    this.uptimeMonitoringUri = fullJson.monitoring_uri || null;
    this.fullJson = fullJson;
  }
}

// export const readSiteFiles = (repoPath: string):
export const getAllSites = async (repoPath: string) => {
  const sites = [];

  // const yamlFiles = await listYamlFiles(repoPath);
  // console.log(yamlFiles);
  // return;
  for (const fileName of await listYamlFiles(repoPath)) {
    // Extract infrastructure and identifier from file name.
    const [serverInfrastructure, serverIdentifier] = fileName
      .substr(0, fileName.lastIndexOf('.'))
      .split('/');

    const yaml = await readYamlFile(`${repoPath}${fileName}`, 'utf8');
    console.log('filename!', fileName);
    if (yaml.hasOwnProperty('drupalsites')) {
      const serverNameOverwriteKey = 'amazeeio::servername';

      const siteHost = yaml.hasOwnProperty(serverNameOverwriteKey)
        ? yaml[serverNameOverwriteKey]
        : `${serverIdentifier}.${serverInfrastructure}`;

      let serverNames;
      let jumpHost;
      // @todo Is it correct to hard-code this?
      const clusterMemberKey = 'drupalhosting::profiles::nginx_backend::cluster_member';

      const jumphostKey = 'amazeeio::jumphost';

      if (serverInfrastructure === 'cluster' && yaml.hasOwnProperty(clusterMemberKey)) {
        serverNames = Object.keys(yaml[clusterMemberKey]).map(key => `${key}.${siteHost}`);
      } else if (serverInfrastructure === 'single') {
        serverNames = [`backend.${siteHost}`];
      } else {
        serverNames = siteHost instanceof Array ? siteHost : [siteHost];
      }

      if (yaml.hasOwnProperty(jumphostKey)) {
        jumpHost = yaml[jumphostKey];
      } else {
        jumpHost = null;
      }

      Object.keys(yaml.drupalsites).forEach((siteName) => {
        if (!yaml.drupalsites.hasOwnProperty(siteName)) {
          return;
        }
        sites.push(new Site(
          siteName,
          serverInfrastructure,
          serverIdentifier,
          serverNames,
          jumpHost,
          yaml.drupalsites[siteName],
        ));
      });
    }
  }
  return sites;
};
// export
// const path = require('path');
// const R = require('ramda');
// const { readFile, writeFile } = require('../util/fs');
//
// import type { SiteGroupFile, SiteGroup } from '../types';
//
// export const siteGroupsFilePath = (repoPath: string) =>
//   path.join(repoPath, 'amazeeio', 'sitegroups.yaml');
//
// export const siteGroupToYaml = (siteGroup: SiteGroup): string => // TODO: Maybe use a schema?
// Yaml.safeDump(siteGroup);
//
// export const writeSiteGroupsFile = (repoPath: string, yamlContent: string): Promise<void> =>
//   writeFile(siteGroupsFilePath(repoPath), yamlContent, 'utf8');
//
// export const readSiteGroupsFile = (repoPath: string): Promise<string> =>
//   readFile(siteGroupsFilePath(repoPath), 'utf8');
//
// export const parseSiteGroupsFile = (yamlContent: string): SiteGroupFile => R.compose(
//   R.propOr({}, 'amazeeio_sitegroups'),
//   // TODO: Maybe use a schema w/ safeLoad?
//   Yaml.safeLoad,
// )(yamlContent);
