// @flow

export type ClientFile = {
  amazeeio_clients: {
    [clientName: string]: Client,
  },
};

export type SiteGroupFile = {
  amazeeio_sitegroups: {
    [siteGroupName: string]: SiteGroup,
  },
}

export type SiteFile = {
  drupalsites: {
    [siteName: string]: Site,
  },
};

type SshKeys = {
  [sshKeyName: string]: {
    key: string,
  },
};

export type Client = {
  deploy_private_key?: string,
  php_admin_value?: {
    [key: string]: string,
  },
  ssh_keys?: SshKeys,
};

export type Site = {
  sitegroup: string,
  uid: number,
  site_branch: string,
  site_environment: string,
  domains: Array<string>,
  sslcerttype: string,
  fpm_profile: string,
  cron?: {
    type: string,
    minute: string,
  },
  php_flags: {[name: string]: mixed},
  xdebug: string,
  php_admin_values: {
    [key: string]: string,
  },
};

export type SiteGroup = {
  client: string,
  ssh_keys?: SshKeys,
  php_values?: {
    [key: string]: mixed,
  },
  production_url?: string,
  git_url?: string,
  slack?: {
    webhook: string,
    channel: string,
    inform_start: boolean,
    inform_channel: string,
  }
};
