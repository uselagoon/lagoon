import {
  readFile,
  writeFile,
  commitFile,
} from '../../utility/yamlStorage';

export default class SiteGroup {
  constructor(siteGroupName, fullJson) {
    this.id = siteGroupName;
    this.siteGroupName = siteGroupName;
    this.created = fullJson.created;
    this.clientName = fullJson.client || null;
    this.billingClientName = fullJson.billingclient || fullJson.client;
    this.gitUrl = fullJson.git_url || null;
    this.slack = fullJson.slack || null;
    this.openshift = fullJson.openshift || null;
    this.comment = fullJson.comment || null;
    this.activeSystems = fullJson.active_systems || null;
    this.fullJson = fullJson;
  }
}

export const getAllSiteGroups = async () => {
  const fileName = 'amazeeio/sitegroups.yaml';

  const siteGroups = [];
  const yaml = await readFile(fileName);
  if (yaml.hasOwnProperty('amazeeio_sitegroups')) {
    Object.keys(yaml.amazeeio_sitegroups).forEach((siteGroupName) => {
      if (yaml.amazeeio_sitegroups.hasOwnProperty(siteGroupName)) {
        siteGroups.push(new SiteGroup(siteGroupName, yaml.amazeeio_sitegroups[siteGroupName]));
      }
    });
  }

  return siteGroups;
};

export const getSiteGroupById = async (id) => { // eslint-disable-line arrow-body-style
  return (await getAllSiteGroups()).find((siteGroup) => siteGroup.id === id);
};

export const getSiteGroupByName = async (siteGroupName) => { // eslint-disable-line arrow-body-style
  return (await getAllSiteGroups()).find((siteGroup) => siteGroup.siteGroupName === siteGroupName);
};

export const getSiteGroupByGitUrl = async (siteGroupgitUrl) => { // eslint-disable-line arrow-body-style
  return (await getAllSiteGroups()).find((siteGroup) => siteGroup.gitUrl === siteGroupgitUrl);
};

export const createSiteGroup = async (siteGroupName, fullJson) => {
  const filePath = 'amazeeio/sitegroups.yaml';

  const yaml = await readFile(filePath);
  yaml.amazeeio_sitegroups = yaml.amazeeio_sitegroups || {};
  if (yaml.amazeeio_sitegroups.hasOwnProperty(siteGroupName)) {
    throw new Error(`The ${siteGroupName} sitegroup already exists.`);
  }

  yaml.amazeeio_sitegroups[siteGroupName] = fullJson;

  await writeFile(filePath, yaml);
  await commitFile(filePath, `Added a sitegroup named ${siteGroupName}.`, repository);

  return new SiteGroup(siteGroupName, fullJson);
};

export const updateSiteGroup = async (siteGroupName, fullJson) => {
  const filePath = 'amazeeio/sitegroups.yaml';

  const yaml = await readFile(filePath);
  yaml.amazeeio_sitegroups = yaml.amazeeio_sitegroups || {};
  if (!yaml.amazeeio_sitegroups.hasOwnProperty(siteGroupName)) {
    throw new Error(`The ${siteGroupName} sitegroup does not exist.`);
  }

  yaml.amazeeio_sitegroups[siteGroupName] = fullJson;

  await writeFile(filePath, yaml);
  await commitFile(filePath, `Updated a sitegroup named ${siteGroupName}.`, repository);

  return new SiteGroup(siteGroupName, fullJson);
};
