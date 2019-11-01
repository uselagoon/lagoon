import * as R from 'ramda';
import { asyncPipe } from '@lagoon/commons/src/util';
import pickNonNil from '../util/pickNonNil';
import * as logger from '../logger';

import { User } from './user';
import {
  loadGroupById,
  loadGroupByName,
  getProjectsFromGroupAndSubgroups,
} from './group';

import { query } from '../util/db';
import { getSqlClient } from '../clients/sqlClient';
import {
  selectProject,
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
  loadProjectById: (id: Number) => Promise<Project>;
  loadProjectByName: (name: String) => Promise<Project>;

  loadAllProjectsByGroupId: () => Promise<[Project]>;
  loadAllProjectsByGroupName: () => Promise<[Project]>;
}
*/

export const loadProjectById = async (
  id: Number,
  sqlClient = getSqlClient(),
) => {
  const rows = await query(sqlClient, selectProject(id));
  return R.prop(0, rows);
};

export const loadProjectByName = async (
  name: string,
  sqlClient = getSqlClient(),
) => {
  const projectFromName = asyncPipe(R.prop('name'), async name => {
    const rows = await query(sqlClient, selectProjectByName(name));
    const project = R.prop(0, rows);

    if (!project) {
      throw new Error('Unauthorized');
    }

    return project;
  });
};

export const loadAllProjectsByGroupId = async (id: Number) => {};

export const loadAllProjectsByGroupName = async (
  name: string,
  sqlClient = getSqlClient(),
) => {
  const group = await loadGroupByName(name);
  const projectIds = await getProjectsFromGroupAndSubgroups(group);
  const projects = await sqlClient.query(selectProjectsByIds(
    projectIds,
  ) as string);
  return projects;
};

export default {};
