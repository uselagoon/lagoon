// @flow

/**
* Note: We use the Covariant modifier (+) for almost all properties
*       of all domain types.
*       Every attribute marked with a + is automatically readonly
*
*  See: https://flow.org/en/docs/types/interfaces/#toc-covariant-read-only-properties-on-interfaces
*/

export type SshKey = {
  +key: string,

  // See: https://docs.puppet.com/puppet/3.8/types/sshkey.html#sshkey-attribute-type
  +type?: 'ssh-dss' | 'ssh-rsa' | 'ssh-ed25519',
};

export type SshKeys = { +[sshKeyName: string]: SshKey };

export type Client = {
  +deploy_private_key?: string,
  +php_admin_value?: { [key: string]: string },
  +ssh_keys?: SshKeys,
};

export type Slack = {
  +webhook: string,
  +channel: string,
  +inform_start: boolean,
  +inform_channel: string,
};

export type BasicAuth = {
  +username: string,
};

export type Site = {
  +sitegroup: string,
  +uid: number,
  +site_branch: string,
  +webroot?: string,
  +site_environment: string,
  +domains: Array<string>,
  +sslcerttype: string,
  +cron?: { type: string, minute: string },
  +php_flags: { [name: string]: mixed },
  +xdebug: string,
  +php_admin_values: { [key: string]: string },
  +solr_enabled?: boolean,
  +drupal_version?: string,
  +fpm_profile: string,
  +redirect_domains: Array<string>,
  +redirects: Array<string>,
  +db_user: string,
  +custom_cron: Object,
  +env_variables: Object,
  +no_prefixenv_variables: Object,
  +php_values: Object,
  +php_admin_flags: Object,
  +nginx_sitespecific: boolean,
  +nginx_siteconfig: string,
  +redis_enabled: boolean,
  +ssh_keys: Object,
  +php_version: string,
  +redirect_to_https: string,
  +upstream_url: string,
  +basic_auth: BasicAuth,
  +deploy_strategy: string,
  +created?: string,
  +comment?: string,
  +monitoring_level?: string,
  +uptime_monitoring_uri?: string,
};

export type SiteGroup = {
  +client: string,
  +ssh_keys?: SshKeys,
  +php_values?: { [key: string]: mixed },
  +production_url?: string,
  +git_url?: string,
  +slack?: Slack,
  +openshift?: Object,
  +billingclient?: string,
  +created?: string,
  +active_systems?: Object,
  +comment?: string,
};

export type Clients = {
  +[client_name: string]: ?Client,
};
export type ClientsFile = {
  +amazeeio_clients: Clients,
};

export type SiteGroups = {
  +[site_group_name: string]: SiteGroup,
};

export type SiteGroupsFile = {
  +amazeeio_sitegroups: SiteGroups,
};

export type SiteFile = {
  +drupalsites: {
    +[site_name: string]: Site,
  },
  +classes: any,
  +stack_environment: Object,
  +'drupalhosting::profiles::client::ipv4_address': string,
  +'profile_monitoring::profiles::client::ipv4_address': string,
  +'profile_monitoring::client::commands:': Object,
  +'profile_icinga2::host::hiera_vars': Object,
  +'amazeeio::servername': string | Array<string>,
  +'amazeeio::jumphost': string,
  +'drupalhosting::profiles::nginx_backend::cluster_member'?: {
    [string]: string,
  },
};

export type SiteFiles = {
  +[site_path: string]: SiteFile,
};

// process.env stuff
export type ApiEnv = {
  GIT_USERNAME: string,
  GIT_PASSWORD: string,
  GIT_REPOSITORY: string,
  // Upstream repository to sync
  GIT_BRANCH_PULL: string,
  // branch to pull from
  GIT_BRANCH_PUSH: string,
  // branch to push to
  GIT_PUSH_ENABLE: boolean,
  GIT_SYNC_INTERVAL: number,
  GIT_REPO_DIR: string,
  JWTSECRET: string,
  JWTAUDIENCE?: string,
};
