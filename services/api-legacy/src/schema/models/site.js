import {
  listYamlFiles,
  readFile,
  existsFile,
  accessFile,
  writeFile,
  commitFile,
} from '../../utility/yamlStorage';

export default class Site {
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
    this.noPrefixenvVariables = fullJson.no_prefix_env_variables
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

export const getAllSites = async () => {
  const sites = [];

  for (const fileName of await listYamlFiles()) {
    // Extract infrastructure and identifier from file name.
    const [
      serverInfrastructure,
      serverIdentifier,
    ] = fileName.substr(0, fileName.lastIndexOf('.')).split('/');

    const yaml = await readFile(fileName);
    if (yaml.hasOwnProperty('drupalsites')) {
      const serverNameOverwriteKey = 'amazeeio::servername';

      const siteHost = yaml.hasOwnProperty(serverNameOverwriteKey) ? yaml[serverNameOverwriteKey] : `${serverIdentifier}.${serverInfrastructure}`;

      var serverNames;
      var jumpHost;
      // @todo Is it correct to hard-code this?
      const clusterMemberKey = 'drupalhosting::profiles::nginx_backend::cluster_member';

      const jumphostKey = 'amazeeio::jumphost';

      if (serverInfrastructure === 'cluster' && yaml.hasOwnProperty(clusterMemberKey)) {
        serverNames = Object.keys(yaml[clusterMemberKey]).map((key) => `${key}.${siteHost}`);
      } else if (serverInfrastructure === 'single') {
        serverNames = [`backend.${siteHost}`];
      } else {
        serverNames = (siteHost instanceof Array) ? siteHost : [siteHost];
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

export const getSiteById = async (id) => { // eslint-disable-line
  return (await getAllSites()).find((site) => site.id === id);
};

export const createSite = async (siteName, siteHost, fullJson) => {
  const filePath = `${siteHost.split('.').reverse().join('/')}.yaml`;

  if (!(await existsFile(filePath)) || !(await accessFile(filePath))) {
    throw new Error(`Server ${siteHost} does not exist.`);
  }

  const before = await readFile(filePath);
  if (!before.hasOwnProperty('drupalsites')) {
    throw new Error(`Server ${siteHost} does not have "drupalsites".`);
  }

  if (before.drupalsites.hasOwnProperty(siteName)) {
    throw new Error(`Site ${siteName} already exists on the ${siteHost} server.`);
  }

  const uid = Object.values(before.drupalsites)
    .map((site) => parseInt(site.uid, 10))
    .reduce((previous, current) => { // eslint-disable-line arrow-body-style
      return current > previous ? current : previous;
    }, 3200) + 1;

  const site = {
    ...fullJson,
    uid,
  };

  const after = {
    ...before,
    drupalsites: {
      ...before.drupalsites,
      [siteName]: site,
    },
  };

  // Write the new contents to the file.
  await writeFile(filePath, after);
  await commitFile(filePath, `Added a site named ${siteName} to ${siteHost} server.`, repository); // eslint-disable-line max-len

  return new Site(siteName, siteHost, fullJson);
};

export const updateSite = async (siteName, siteHost, fullJson) => {
  const filePath = `${siteHost.split('.').reverse().join('/')}.yaml`;

  if (!(await existsFile(filePath)) || !(await accessFile(filePath))) {
    throw new Error(`Server ${siteHost} does not exist.`);
  }

  const yaml = await readFile(filePath);
  if (!yaml.hasOwnProperty('drupalsites')) {
    throw new Error(`Server ${siteHost} does not have "drupalsites".`);
  }

  if (!yaml.drupalsites.hasOwnProperty(siteName)) {
    throw new Error(`Site ${siteName} does not exist at the ${siteHost} server.`);
  }

  yaml.drupalsites[siteName] = fullJson;

  await writeFile(filePath, yaml);
  await commitFile(filePath, `Updated the ${siteName} site at the ${siteHost} server.`, repository);

  return new Site(siteName, siteHost, fullJson);
};
