import * as R from 'ramda';
import {
  // loadGroupById,
  // loadGroupByName,
  // getProjectsFromGroupAndSubgroups,
  Group,
} from './group';

import { query } from '../util/db';
import { getSqlClient } from '../clients/sqlClient';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';
import {
  selectProject as selectProjectById,
  selectProjectByName,
  selectProjectsByIds,
} from '../resources/project/sql';

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

/*
export interface ProjectModel {
  ProjectById: (id: Number) => Promise<Project>;
  ProjectByName: (name: String) => Promise<Project>;

  AllProjectsByGroupId: () => Promise<[Project]>;
  AllProjectsByGroupName: () => Promise<[Project]>;
}
*/

export const projectById = async (id: Number, sqlClient = getSqlClient()) => {
  const rows = await query(sqlClient, selectProjectById(id));
  return R.prop(0, rows);
};

export const projectByName = async (
  name: string,
  sqlClient = getSqlClient(),
) => {
  const rows = await query(sqlClient, selectProjectByName(name));
  const project = R.prop(0, rows);

  if (!project) {
    throw new Error('Unauthorized');
  }

  return project;
};

export const projectsByGroup = async (
  group: Group,
  sqlClient = getSqlClient(),
) => {
  const keycloakAdminClient = await getKeycloakAdminClient();
  const GroupModel = Group(keycloakAdminClient);
  const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(group);
  return query(sqlClient, selectProjectsByIds(projectIds) as string);
};

export default {
  projectById,
  projectByName,
  projectsByGroup,
};
