import * as R from 'ramda';
import { Group } from './group';
import * as Helpers from '../resources/project/helpers';
import { getSqlClient, USE_SINGLETON } from '../clients/sqlClient';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';

export interface Project {
  id: Number; // int(11) NOT NULL AUTO_INCREMENT,
  name: String; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  customer: Number; // int(11) DEFAULT NULL,
  git_url: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  active_systems_deploy: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  active_systems_remove: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  branches: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  pullrequests: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  production_environment: String; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  openshift: Number; // int(11) DEFAULT NULL,
  created: String; // timestamp NOT NULL DEFAULT current_timestamp(),
  active_systems_promote: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  auto_idle: Boolean; // int(1) NOT NULL DEFAULT 1,
  storage_calc: Boolean; // int(1) NOT NULL DEFAULT 1,
  subfolder: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  openshift_project_pattern: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  development_environments_limit: Number; // int(11) DEFAULT NULL,
  active_systems_task: String; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  private_key: String; // varchar(5000) COLLATE utf8_bin DEFAULT NULL,
  availability: String; // varchar(50) COLLATE utf8_bin DEFAULT NULL,
}

export const projectsByGroup = async (group: Group) => {
  const sqlClient = getSqlClient(USE_SINGLETON);
  const keycloakAdminClient = await getKeycloakAdminClient();
  const GroupModel = Group(keycloakAdminClient);
  const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(group);
  const projects = await Helpers(sqlClient).getProjectsByIds(projectIds);
  return projects;
};

export default {
  projectsByGroup,
};
