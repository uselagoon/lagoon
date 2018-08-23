// @flow

// TODO: Type the rest of the config
export type ConfigFile = {
  +api?: string,
  +branches?: string,
  +customer?: number,
  +git_url?: string,
  +openshift?: number,
  +production_environment?: string,
  +project?: string,
  +pullrequests?: string,
  +ssh?: string,
  +token?: string,
};

export type ConfigFileInput = {|
  project: string,
  api: string,
  ssh: string,
  token: string,
|};

export const configFileInputOptionsTypes = {
  project: String,
  api: String,
  ssh: String,
  token: String,
};
